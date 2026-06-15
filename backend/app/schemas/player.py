from pydantic import BaseModel
from datetime import date
from typing import Optional


class PlayerSearch(BaseModel):
    id: int
    name: str
    team: str
    position: str

    model_config = {"from_attributes": True}


class PlayerDetail(BaseModel):
    id: int
    kbo_id: str
    name: str
    name_en: Optional[str] = None
    team: str
    position: str
    birth_date: Optional[date] = None
    throws: Optional[str] = None
    bats: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    draft: Optional[str] = None
    school: Optional[str] = None

    model_config = {"from_attributes": True}
