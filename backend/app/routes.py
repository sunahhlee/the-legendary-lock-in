from datetime import date as date_type
from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.auth import get_current_user_id
from app.models import DailyLog, MealEntry, FoodTemplate, UserGoal, User
from app.schemas import (
    DailyLogResponse,
    EnergyJournalUpdate,
    JournalEntryResponse,
    UserResponse,
    MealEntryCreate,
    MealEntryUpdate,
    MealEntryResponse,
    FoodTemplateCreate,
    FoodTemplateResponse,
    TimeseriesResponse,
    UserGoalCreate,
    UserGoalResponse,
    UserResponse,
    UserUpdate,
)
from app.crud import (
    get_or_create_daily_log,
    build_daily_log_response,
    get_timeseries_analytics,
)

router = APIRouter(prefix="/api", tags=["Diet Tracker"])


# ==========================================
# Current User Profile Endpoints
# ==========================================

@router.get("/me", response_model=UserResponse)
def get_me(
    email: Optional[str] = Query(None),
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Return current user profile, creating the row on first login."""
    user_id = UUID(user_id_str)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        if not email:
            raise HTTPException(status_code=400, detail="email query param required for first login")
        user = User(id=user_id, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        created_at=user.created_at,
    )


@router.put("/me", response_model=UserResponse)
def update_me(
    update: UserUpdate,
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update the current user's profile (username)."""
    user_id = UUID(user_id_str)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if update.username is not None:
        user.username = update.username
    db.commit()
    db.refresh(user)
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        created_at=user.created_at,
    )


# ==========================================
# Users Endpoints
# ==========================================

@router.post("/users", response_model=UserResponse)
def create_user(db: Session = Depends(get_db)):
    """Create a user with a randomly generated (uuid4) ID."""
    user_id = uuid4()
    user = User(id=user_id, email=f"user-{user_id}@legendarylockin.local")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ==========================================
# User Goals Endpoints
# ==========================================

@router.get("/users/{user_id}/goals", response_model=List[UserGoalResponse])
def get_user_goals(
    user_id: UUID,
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Retrieve historical and active macro goals for the authenticated user."""
    auth_id = UUID(user_id_str)
    if user_id != auth_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    goals = (
        db.query(UserGoal)
        .filter(UserGoal.user_id == auth_id)
        .order_by(UserGoal.start_date.desc(), UserGoal.created_at.desc())
        .all()
    )
    return [
        UserGoalResponse(
            id=g.id,
            user_id=g.user_id,
            calorie_goal=float(g.calorie_goal),
            protein_goal=float(g.protein_goal),
            start_date=g.start_date,
            end_date=g.end_date,
            notes=g.notes,
            created_at=g.created_at,
        )
        for g in goals
    ]


@router.post("/users/{user_id}/goals", response_model=UserGoalResponse)
def create_user_goal(
    user_id: UUID,
    goal_in: UserGoalCreate,
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create or update a macro goal object spanning specified dates."""
    auth_id = UUID(user_id_str)
    if user_id != auth_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    user = db.query(User).filter(User.id == auth_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if goal_in.end_date is None:
        previous_open = (
            db.query(UserGoal)
            .filter(
                UserGoal.user_id == auth_id,
                UserGoal.end_date.is_(None),
                UserGoal.start_date < goal_in.start_date,
            )
            .all()
        )
        for p in previous_open:
            p.end_date = goal_in.start_date

    goal = UserGoal(
        user_id=auth_id,
        calorie_goal=goal_in.calorie_goal,
        protein_goal=goal_in.protein_goal,
        start_date=goal_in.start_date,
        end_date=goal_in.end_date,
        notes=goal_in.notes,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    return UserGoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        calorie_goal=float(goal.calorie_goal),
        protein_goal=float(goal.protein_goal),
        start_date=goal.start_date,
        end_date=goal.end_date,
        notes=goal.notes,
        created_at=goal.created_at,
    )


@router.delete("/goals/{goal_id}")
def delete_user_goal(
    goal_id: UUID,
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a macro goal record (only owner can delete)."""
    auth_id = UUID(user_id_str)
    goal = db.query(UserGoal).filter(UserGoal.id == goal_id, UserGoal.user_id == auth_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully", "id": str(goal_id)}


# ==========================================
# Daily Logs & Entries Endpoints
# ==========================================

@router.get("/logs", response_model=List[DailyLogResponse])
def get_daily_logs(
    start_date: Optional[date_type] = Query(None),
    end_date: Optional[date_type] = Query(None),
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Retrieve daily logs for a date range."""
    auth_id = UUID(user_id_str)
    query = db.query(DailyLog).filter(DailyLog.user_id == auth_id)
    if start_date:
        query = query.filter(DailyLog.date >= start_date)
    if end_date:
        query = query.filter(DailyLog.date <= end_date)
    logs = query.order_by(DailyLog.date.desc()).all()
    return [build_daily_log_response(log, db) for log in logs]


@router.get("/logs/{log_date}", response_model=DailyLogResponse)
def get_daily_log_by_date(
    log_date: date_type,
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Fetch log for a specific date, creating it if not already present."""
    auth_id = UUID(user_id_str)
    log = get_or_create_daily_log(db, auth_id, log_date)
    return build_daily_log_response(log, db)


@router.get("/journal", response_model=List[JournalEntryResponse])
def list_journal_entries(
    start_date: Optional[date_type] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date_type] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: Optional[int] = Query(10, ge=1, le=1000, description="Max entries, newest first"),
    db: Session = Depends(get_db),
):
    """List non-empty energy journal entries, newest first. Defaults to the last 10."""
    query = db.query(DailyLog).filter(
        DailyLog.user_id == CURRENT_USER_ID,
        DailyLog.energy_journal.isnot(None),
        DailyLog.energy_journal != "",
    )
    if start_date:
        query = query.filter(DailyLog.date >= start_date)
    if end_date:
        query = query.filter(DailyLog.date <= end_date)

    logs = query.order_by(DailyLog.date.desc()).limit(limit).all()
    return [JournalEntryResponse(date=l.date, energy_journal=l.energy_journal) for l in logs]


@router.put("/logs/{log_date}/energy-journal", response_model=DailyLogResponse)
def update_energy_journal(
    log_date: date_type,
    journal_in: EnergyJournalUpdate,
    db: Session = Depends(get_db),
):
    """Set the freeform energy journal (max 500 chars) for a given date."""
    log = get_or_create_daily_log(db, CURRENT_USER_ID, log_date)
    text = journal_in.energy_journal.strip() if journal_in.energy_journal else None
    log.energy_journal = text or None
    db.commit()
    db.refresh(log)
    return build_daily_log_response(log, db)


@router.post("/logs/{log_date}/entries", response_model=DailyLogResponse)
def add_meal_entry(
    log_date: date_type,
    entry_in: MealEntryCreate,
    save_as_template: bool = Query(False),
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Log an item for a given date."""
    auth_id = UUID(user_id_str)
    log = get_or_create_daily_log(db, auth_id, log_date)

    template_id = entry_in.template_id

    if save_as_template:
        template = FoodTemplate(
            user_id=auth_id,
            name=entry_in.name,
            default_calories=entry_in.calories,
            default_protein=entry_in.protein,
            default_grams=entry_in.grams,
        )
        db.add(template)
        db.flush()
        template_id = template.id

    new_entry = MealEntry(
        daily_log_id=log.id,
        template_id=template_id,
        name=entry_in.name,
        calories=entry_in.calories,
        protein=entry_in.protein,
        grams=entry_in.grams,
        sort_order=entry_in.sort_order,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(log)

    return build_daily_log_response(log, db)


@router.put("/entries/{entry_id}", response_model=MealEntryResponse)
def update_meal_entry(
    entry_id: UUID,
    entry_update: MealEntryUpdate,
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update an existing logged item (owner only)."""
    auth_id = UUID(user_id_str)
    entry = (
        db.query(MealEntry)
        .join(DailyLog, MealEntry.daily_log_id == DailyLog.id)
        .filter(MealEntry.id == entry_id, DailyLog.user_id == auth_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Meal entry not found")

    if entry_update.name is not None:
        entry.name = entry_update.name
    if entry_update.calories is not None:
        entry.calories = entry_update.calories
    if entry_update.protein is not None:
        entry.protein = entry_update.protein
    if entry_update.grams is not None:
        entry.grams = entry_update.grams
    if entry_update.sort_order is not None:
        entry.sort_order = entry_update.sort_order

    db.commit()
    db.refresh(entry)

    return MealEntryResponse(
        id=entry.id,
        daily_log_id=entry.daily_log_id,
        template_id=entry.template_id,
        name=entry.name,
        calories=float(entry.calories),
        protein=float(entry.protein),
        grams=float(entry.grams) if entry.grams is not None else None,
        sort_order=entry.sort_order,
        created_at=entry.created_at,
    )


@router.delete("/entries/{entry_id}")
def delete_meal_entry(
    entry_id: UUID,
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a logged food item (owner only)."""
    auth_id = UUID(user_id_str)
    entry = (
        db.query(MealEntry)
        .join(DailyLog, MealEntry.daily_log_id == DailyLog.id)
        .filter(MealEntry.id == entry_id, DailyLog.user_id == auth_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Meal entry not found")

    db.delete(entry)
    db.commit()
    return {"message": "Meal entry deleted successfully", "id": str(entry_id)}


# ==========================================
# Timeseries Analytics
# ==========================================

@router.get("/analytics/timeseries", response_model=TimeseriesResponse)
def get_analytics(
    start_date: Optional[date_type] = Query(None),
    end_date: Optional[date_type] = Query(None),
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get aggregated daily calories and protein for timeseries visualization."""
    auth_id = UUID(user_id_str)
    return get_timeseries_analytics(db, auth_id, start_date, end_date)


# ==========================================
# Food Templates Endpoints
# ==========================================

@router.get("/templates", response_model=List[FoodTemplateResponse])
def get_food_templates(
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List all saved food templates for the authenticated user."""
    auth_id = UUID(user_id_str)
    templates = (
        db.query(FoodTemplate)
        .filter(FoodTemplate.user_id == auth_id)
        .order_by(FoodTemplate.name.asc())
        .all()
    )
    return [
        FoodTemplateResponse(
            id=t.id,
            user_id=t.user_id,
            name=t.name,
            default_calories=float(t.default_calories),
            default_protein=float(t.default_protein),
            default_grams=float(t.default_grams) if t.default_grams is not None else None,
            category=t.category,
            created_at=t.created_at,
        )
        for t in templates
    ]


@router.post("/templates", response_model=FoodTemplateResponse)
def create_food_template(
    template_in: FoodTemplateCreate,
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new reusable food item template."""
    auth_id = UUID(user_id_str)
    template = FoodTemplate(
        user_id=auth_id,
        name=template_in.name,
        default_calories=template_in.default_calories,
        default_protein=template_in.default_protein,
        default_grams=template_in.default_grams,
        category=template_in.category,
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    return FoodTemplateResponse(
        id=template.id,
        user_id=template.user_id,
        name=template.name,
        default_calories=float(template.default_calories),
        default_protein=float(template.default_protein),
        default_grams=float(template.default_grams) if template.default_grams is not None else None,
        category=template.category,
        created_at=template.created_at,
    )


@router.delete("/templates/{template_id}")
def delete_food_template(
    template_id: UUID,
    user_id_str: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Remove a food template (owner only)."""
    auth_id = UUID(user_id_str)
    template = (
        db.query(FoodTemplate)
        .filter(FoodTemplate.id == template_id, FoodTemplate.user_id == auth_id)
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Food template not found")

    db.delete(template)
    db.commit()
    return {"message": "Food template deleted successfully", "id": str(template_id)}
