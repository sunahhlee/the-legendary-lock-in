from datetime import date as date_type
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models import DailyLog, MealEntry, FoodTemplate, UserGoal
from app.schemas import (
    DailyLogResponse,
    MealEntryResponse,
    DailyMacroPoint,
    TimeseriesResponse,
)


def get_goal_for_date(db: Session, user_id: UUID, target_date: date_type) -> Optional[UserGoal]:
    """Finds the user's active goal spanning the target date."""
    return (
        db.query(UserGoal)
        .filter(
            UserGoal.user_id == user_id,
            UserGoal.start_date <= target_date,
            or_(UserGoal.end_date.is_(None), UserGoal.end_date >= target_date),
        )
        .order_by(UserGoal.start_date.desc(), UserGoal.created_at.desc())
        .first()
    )


def get_or_create_daily_log(db: Session, user_id: UUID, log_date: date_type) -> DailyLog:
    """Finds an existing daily log for the user and date, or creates one."""
    log = db.query(DailyLog).filter(DailyLog.user_id == user_id, DailyLog.date == log_date).first()
    if not log:
        log = DailyLog(user_id=user_id, date=log_date)
        db.add(log)
        db.commit()
        db.refresh(log)
    return log


def build_daily_log_response(log: DailyLog, db: Optional[Session] = None) -> DailyLogResponse:
    """Constructs DailyLogResponse with calculated total calories, protein, and applicable goals."""
    entries_responses: List[MealEntryResponse] = []
    total_cal = 0.0
    total_prot = 0.0

    for entry in log.entries:
        c = float(entry.calories)
        p = float(entry.protein)
        total_cal += c
        total_prot += p
        entries_responses.append(
            MealEntryResponse(
                id=entry.id,
                daily_log_id=entry.daily_log_id,
                template_id=entry.template_id,
                name=entry.name,
                calories=c,
                protein=p,
                grams=float(entry.grams) if entry.grams is not None else None,
                sort_order=entry.sort_order,
                created_at=entry.created_at,
            )
        )

    calorie_goal = None
    protein_goal = None
    if db is not None:
        goal = get_goal_for_date(db, log.user_id, log.date)
        if goal:
            calorie_goal = float(goal.calorie_goal)
            protein_goal = float(goal.protein_goal)

    return DailyLogResponse(
        id=log.id,
        user_id=log.user_id,
        date=log.date,
        notes=log.notes,
        energy_journal=log.energy_journal,
        entries=entries_responses,
        total_calories=round(total_cal, 3),
        total_protein=round(total_prot, 3),
        calorie_goal=calorie_goal,
        protein_goal=protein_goal,
        created_at=log.created_at,
    )


def get_timeseries_analytics(
    db: Session,
    user_id: UUID,
    start_date: Optional[date_type] = None,
    end_date: Optional[date_type] = None,
) -> TimeseriesResponse:
    """Aggregates total calories, protein, and active calorie goal per date for dual-axis charting."""
    query = (
        db.query(
            DailyLog.date.label("date"),
            func.coalesce(func.sum(MealEntry.calories), 0).label("total_calories"),
            func.coalesce(func.sum(MealEntry.protein), 0).label("total_protein"),
            func.count(MealEntry.id).label("entry_count"),
        )
        .outerjoin(MealEntry, DailyLog.id == MealEntry.daily_log_id)
        .filter(DailyLog.user_id == user_id)
    )

    if start_date:
        query = query.filter(DailyLog.date >= start_date)
    if end_date:
        query = query.filter(DailyLog.date <= end_date)

    results = query.group_by(DailyLog.date).order_by(DailyLog.date.asc()).all()

    # Fetch all goals for user to annotate timeseries dates with applicable goal
    goals = (
        db.query(UserGoal)
        .filter(UserGoal.user_id == user_id)
        .order_by(UserGoal.start_date.asc())
        .all()
    )

    points = []
    for row in results:
        active_goal = None
        for g in goals:
            if g.start_date <= row.date and (g.end_date is None or g.end_date >= row.date):
                active_goal = g
                # Keep checking later goals that might override

        cal_limit = float(active_goal.calorie_goal) if active_goal else None
        prot_limit = float(active_goal.protein_goal) if active_goal else None

        points.append(
            DailyMacroPoint(
                date=row.date,
                total_calories=round(float(row.total_calories), 3),
                total_protein=round(float(row.total_protein), 3),
                entry_count=int(row.entry_count),
                calorie_goal=cal_limit,
                protein_goal=prot_limit,
            )
        )

    effective_start = start_date or (points[0].date if points else date_type.today())
    effective_end = end_date or (points[-1].date if points else date_type.today())

    return TimeseriesResponse(
        start_date=effective_start,
        end_date=effective_end,
        points=points,
    )
