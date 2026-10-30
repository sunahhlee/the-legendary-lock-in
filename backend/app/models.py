import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    Numeric,
    Integer,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    daily_logs = relationship("DailyLog", back_populates="user", cascade="all, delete-orphan")
    food_templates = relationship("FoodTemplate", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("UserGoal", back_populates="user", cascade="all, delete-orphan", order_by="UserGoal.start_date.desc()")


class UserGoal(Base):
    __tablename__ = "user_goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    calorie_goal = Column(Numeric(8, 2), nullable=False)
    protein_goal = Column(Numeric(7, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    notes = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="goals")


class FoodTemplate(Base):
    __tablename__ = "food_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    default_calories = Column(Numeric(8, 3), nullable=False)
    default_protein = Column(Numeric(7, 3), nullable=False, default=0.0)
    default_grams = Column(Numeric(8, 2), nullable=True)
    category = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="food_templates")
    entries = relationship("MealEntry", back_populates="template")


class DailyLog(Base):
    __tablename__ = "daily_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(String, nullable=True)
    energy_journal = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_daily_logs_user_date"),
    )

    user = relationship("User", back_populates="daily_logs")
    entries = relationship(
        "MealEntry",
        back_populates="daily_log",
        cascade="all, delete-orphan",
        order_by="MealEntry.sort_order, MealEntry.created_at",
    )


class MealEntry(Base):
    __tablename__ = "meal_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    daily_log_id = Column(UUID(as_uuid=True), ForeignKey("daily_logs.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("food_templates.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    calories = Column(Numeric(8, 3), nullable=False)
    protein = Column(Numeric(7, 3), nullable=False, default=0.0)
    grams = Column(Numeric(8, 2), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    daily_log = relationship("DailyLog", back_populates="entries")
    template = relationship("FoodTemplate", back_populates="entries")
