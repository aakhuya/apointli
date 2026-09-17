from pydantic import BaseModel, Field

from app.models.organization_member import MemberRole


# ─── Requests ───
class CreateOrganizationRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    timezone: str = Field(default="UTC", max_length=50)
    currency: str = Field(default="USD", max_length=3)


class AddMemberRequest(BaseModel):
    email: str
    role: MemberRole = MemberRole.STAFF


class UpdateMemberRoleRequest(BaseModel):
    role: MemberRole


# ─── Responses ───
class OrganizationSummary(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    logo_url: str | None

    model_config = {"from_attributes": True}


class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    cover_url: str | None
    website: str | None
    phone: str | None
    email: str | None
    address: str | None
    city: str | None
    state: str | None
    country: str | None
    postal_code: str | None
    timezone: str
    currency: str
    is_active: bool
    role: MemberRole  # requesting user's role in this org

    model_config = {"from_attributes": True}


class MemberResponse(BaseModel):
    id: str
    user_id: str
    email: str
    first_name: str | None
    last_name: str | None
    role: MemberRole
    accepted_at: str | None

    model_config = {"from_attributes": True}
