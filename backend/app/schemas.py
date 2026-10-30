from typing import Optional, List
from datetime import date as date_type, datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


# ==========================================
# User Schemas
# ==========================================

class UserResponse(BaseModel):
    id: UUID
    email: str
    username: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=1, max_length=50)


# ==========================================
# Meal Entry Schemas
# ==========================================

class MealEntryBase(BaseModel):
    name: str = Field(..., min_length=1, description="Food or dish description")
    calories: float = Field(..., ge=0.0, description="Calorie amount (kcal), allows up to 3 decimals")
    protein: float = Field(default=0.0, ge=0.0, description="Protein in grams, allows up to 3 decimals")
    template_id: Optional[UUID] = Field(default=None, description="Optional reference to template")
    grams: Optional[float] = Field(default=None, gt=0.0, description="Optional portion size in grams")
    sort_order: int = Field(default=0, ge=0)


class MealEntryCreate(MealEntryBase):
    pass


class MealEntryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    calories: Optional[float] = Field(default=None, ge=0.0)
    protein: Optional[float] = Field(default=None, ge=0.0)
    grams: Optional[float] = Field(default=None, gt=0.0)
    sort_order: Optional[int] = Field(default=None, ge=0)


class MealEntryResponse(MealEntryBase):
    id: UUID
    daily_log_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Daily Log Schemas
# ==========================================

class DailyLogBase(BaseModel):
    date: date_type
    notes: Optional[str] = None
    energy_journal: Optional[str] = Field(default=None, max_length=500)


class DailyLogCreate(DailyLogBase):
    pass


class JournalEntryResponse(BaseModel):
    date: date_type
    energy_journal: str


class EnergyJournalUpdate(BaseModel):
    energy_journal: Optional[str] = Field(
        default=None, max_length=500, description="Freeform note on energy levels that day"
    )


class DailyLogResponse(DailyLogBase):
    id: UUID
    user_id: UUID
    entries: List[MealEntryResponse] = []
    total_calories: float = 0.0
    total_protein: float = 0.0
    calorie_goal: Optional[float] = None
    protein_goal: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# User Macro Goals Schemas
# ==========================================

class UserGoalBase(BaseModel):
    calorie_goal: float = Field(..., gt=0.0, description="Target daily calories (kcal)")
    protein_goal: float = Field(..., ge=0.0, description="Target daily protein (g)")
    start_date: date_type = Field(..., description="Date from which this goal applies")
    end_date: Optional[date_type] = Field(default=None, description="Optional date this goal spanned until")
    notes: Optional[str] = Field(default=None, max_length=100, description="Optional note on this goal")


class UserGoalCreate(UserGoalBase):
    pass


class UserGoalResponse(UserGoalBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# User Schemas
# ==========================================

class UserResponse(BaseModel):
    id: UUID
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Food Template Schemas (Reusability)
# ==========================================

class FoodTemplateBase(BaseModel):
    name: str = Field(..., min_length=1)
    default_calories: float = Field(..., ge=0.0)
    default_protein: float = Field(default=0.0, ge=0.0)
    default_grams: Optional[float] = Field(
        default=None, gt=0.0, description="Grams that default calories/protein refer to; enables scaling"
    )
    category: Optional[str] = None


class FoodTemplateCreate(FoodTemplateBase):
    pass


class FoodTemplateResponse(FoodTemplateBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Timeseries / Analytics Schemas (Dual-Axis Chart)
# ==========================================

class DailyMacroPoint(BaseModel):
    date: date_type
    total_calories: float
    total_protein: float
    entry_count: int
    calorie_goal: Optional[float] = None
    protein_goal: Optional[float] = None


class TimeseriesResponse(BaseModel):
    start_date: date_type
    end_date: date_type
    points: List[DailyMacroPoint]
