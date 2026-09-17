import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class MemberRole(str, enum.Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    STAFF = "STAFF"
    RECEPTIONIST = "RECEPTIONIST"


class OrganizationMember(Base):
    __tablename__ = "organization_members"
    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_user_org"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role: Mapped[MemberRole] = mapped_column(
        Enum(MemberRole, name="member_role"),
        default=MemberRole.STAFF,
        nullable=False,
    )

    # Invitation flow (future)
    invited_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])  # type: ignore # noqa: F821
    organization: Mapped["Organization"] = relationship(  # type: ignore # noqa: F821
        "Organization", back_populates="members"
    )

    def __repr__(self) -> str:
        return f"<OrganizationMember user={self.user_id} org={self.organization_id} role={self.role}>"
