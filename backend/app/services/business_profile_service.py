import math
import uuid
from datetime import UTC, date, datetime

from fastapi import HTTPException, UploadFile, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import save_upload_file
from app.models.business_profile import (
    BusinessDocumentStatus,
    BusinessProfile,
    BusinessProfileDocument,
    BusinessProfileStatus,
)
from app.models.user import User
from app.models.venue_owner import VenueOwner
from app.repositories.business_profile_repository import BusinessProfileRepository
from app.repositories.venue_owner_repository import VenueOwnerRepository
from app.schemas.business_profile import (
    BookingSummary,
    BusinessOverview,
    BusinessProfileCreateRequest,
    BusinessProfileDetailResponse,
    BusinessProfileListItem,
    BusinessProfileListResponse,
    BusinessProfileMutationResponse,
    BusinessProfileUpdateRequest,
    DocumentInput,
    DocumentResponse,
    DocumentUploadResponse,
    MessageResponse,
    VenueSummary,
    _initials,
)
from app.services.permission_service import DataScope, PermissionService

DOCUMENT_SLOTS = [
    "GST Certificate",
    "PAN Card",
    "Business Registration Certificate",
    "Cancelled Cheque / Bank Proof",
    "Trade License (optional)",
    "Other Supporting Documents (optional)",
]


class BusinessProfileService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = BusinessProfileRepository(db)
        self.owners = VenueOwnerRepository(db)
        self.permissions = PermissionService(db)

    def _scoped_venue_owner_id(self, actor: User) -> uuid.UUID | None:
        scope = self.permissions.get_data_scope(actor)
        if scope == DataScope.ALL:
            return None
        if scope == DataScope.VENDOR_OWNED:
            return None  # resolved async below via owner lookup
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access business profiles.",
        )

    async def _vendor_owner(self, actor: User) -> VenueOwner | None:
        scope = self.permissions.get_data_scope(actor)
        if scope != DataScope.VENDOR_OWNED:
            return None
        owner = await self.owners.get_by_user_id(actor.id)
        if owner is None:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Venue owner profile is required to manage business profiles.",
            )
        return owner

    def _assert_access(self, actor: User, profile: BusinessProfile) -> None:
        scope = self.permissions.get_data_scope(actor)
        if scope == DataScope.ALL:
            return
        if scope == DataScope.VENDOR_OWNED:
            owner = profile.venue_owner
            if owner is None or owner.user_id != actor.id:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="You can only access your own business profiles.",
                )
            return
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access business profiles.",
        )

    async def _resolve_list_owner_filter(self, actor: User) -> uuid.UUID | None:
        vendor = await self._vendor_owner(actor)
        return vendor.id if vendor else None

    def _active_documents(
        self, profile: BusinessProfile
    ) -> list[BusinessProfileDocument]:
        return [d for d in (profile.documents or []) if d.deleted_at is None]

    def _doc_to_response(self, doc: BusinessProfileDocument) -> DocumentResponse:
        uploaded = doc.uploaded_at.date() if doc.uploaded_at else None
        return DocumentResponse(
            id=doc.id,
            name=doc.name,
            document_type=doc.document_type,
            status=doc.status,
            file_name=doc.file_name,
            file_size=doc.file_size,
            file_url=doc.file_url,
            verified_by=doc.verified_by,
            uploaded_date=uploaded,
        )

    def _owner_fields(self, profile: BusinessProfile) -> tuple[str, str, str]:
        owner = profile.venue_owner
        if owner is None:
            return "", "", ""
        return owner.full_name, owner.email, owner.mobile

    def _to_list_item(self, profile: BusinessProfile) -> BusinessProfileListItem:
        owner_name, owner_email, owner_phone = self._owner_fields(profile)
        return BusinessProfileListItem(
            id=profile.id,
            business_code=profile.business_code,
            business_name=profile.business_name,
            legal_business_name=profile.legal_business_name,
            business_type=profile.business_type,
            city=profile.city,
            status=profile.status,
            verification_status=profile.verification_status,
            venue_owner_id=profile.venue_owner_id,
            owner_name=owner_name,
            owner_email=owner_email,
            owner_phone=owner_phone,
            gst_number=profile.gst_number,
            created_at=profile.created_at,
            total_venues=0,
            initials=_initials(profile.business_name),
        )

    def _compute_overview(self, profile: BusinessProfile) -> BusinessOverview:
        # Venues/bookings tables not migrated yet — return live zeros.
        return BusinessOverview(
            verification_status=profile.verification_status,
            business_type=profile.business_type,
            created_at=profile.created_at,
        )

    async def _to_detail(self, profile: BusinessProfile) -> BusinessProfileDetailResponse:
        owner_name, owner_email, owner_phone = self._owner_fields(profile)
        overview = self._compute_overview(profile)
        bank_date = (
            profile.bank_proof_uploaded_at.date()
            if profile.bank_proof_uploaded_at
            else None
        )
        docs = [
            self._doc_to_response(d)
            for d in self._active_documents(profile)
            if d.deleted_at is None
        ]
        return BusinessProfileDetailResponse(
            id=profile.id,
            business_code=profile.business_code,
            venue_owner_id=profile.venue_owner_id,
            business_name=profile.business_name,
            legal_business_name=profile.legal_business_name,
            business_type=profile.business_type,
            years_in_business=profile.years_in_business,
            description=profile.description,
            website=profile.website,
            support_email=profile.support_email,
            support_phone=profile.support_phone,
            alternate_phone=profile.alternate_phone,
            address_line1=profile.address_line1,
            address_line2=profile.address_line2,
            city=profile.city,
            state=profile.state,
            country=profile.country,
            postal_code=profile.postal_code,
            gst_number=profile.gst_number,
            pan_number=profile.pan_number,
            business_registration_number=profile.business_registration_number,
            account_holder_name=profile.account_holder_name,
            bank_name=profile.bank_name,
            account_number=profile.account_number,
            ifsc_code=profile.ifsc_code,
            cancelled_cheque_url=profile.cancelled_cheque_url,
            bank_proof_file_name=profile.bank_proof_file_name,
            bank_proof_file_size=profile.bank_proof_file_size,
            bank_proof_uploaded_date=bank_date,
            verification_status=profile.verification_status,
            verification_notes=profile.verification_notes,
            status=profile.status,
            published_at=profile.published_at,
            owner_name=owner_name,
            owner_email=owner_email,
            owner_phone=owner_phone,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
            created_by=profile.created_by,
            updated_by=profile.updated_by,
            initials=_initials(profile.business_name),
            overview=overview,
            venues=[],
            recent_bookings=[],
            documents=docs,
        )

    async def _assert_no_legal_duplicates(
        self,
        *,
        tenant_id: uuid.UUID | None,
        gst_number: str | None,
        pan_number: str | None,
        business_registration_number: str | None,
        exclude_id: uuid.UUID | None = None,
    ) -> None:
        dup = await self.repo.find_duplicate_legal(
            tenant_id=tenant_id,
            gst_number=gst_number,
            pan_number=pan_number,
            business_registration_number=business_registration_number,
            exclude_id=exclude_id,
        )
        if dup is None:
            return
        if gst_number and dup.gst_number == gst_number:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="A business profile with this GST number already exists.",
            )
        if pan_number and dup.pan_number == pan_number:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="A business profile with this PAN number already exists.",
            )
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="A business profile with this registration number already exists.",
        )

    def _apply_document_inputs(
        self, profile: BusinessProfile, documents: list[DocumentInput]
    ) -> None:
        existing = {d.id: d for d in self._active_documents(profile)}
        seen: set[uuid.UUID] = set()
        for item in documents:
            doc_type = (item.document_type or item.name).strip()
            uploaded_at = (
                datetime.combine(item.uploaded_date, datetime.min.time()).replace(
                    tzinfo=UTC
                )
                if item.uploaded_date
                else (datetime.now(UTC) if item.file_name else None)
            )
            status = item.status
            if item.file_name and status == "pending":
                status = BusinessDocumentStatus.UPLOADED.value

            if item.id and item.id in existing:
                doc = existing[item.id]
                seen.add(item.id)
                doc.name = item.name
                doc.document_type = doc_type
                doc.status = status
                doc.file_name = item.file_name
                doc.file_size = item.file_size
                if item.file_url:
                    doc.file_url = item.file_url
                doc.verified_by = item.verified_by
                if uploaded_at:
                    doc.uploaded_at = uploaded_at
                continue

            profile.documents.append(
                BusinessProfileDocument(
                    document_type=doc_type,
                    name=item.name,
                    file_name=item.file_name,
                    file_size=item.file_size,
                    file_url=item.file_url,
                    status=status,
                    verified_by=item.verified_by,
                    uploaded_at=uploaded_at,
                )
            )

        # Soft-delete removed slots only when caller sent a full documents list
        # that intentionally omits them (matched by id). Keep unmatched existing
        # documents that were not referenced.

    async def list_profiles(
        self,
        actor: User,
        *,
        search: str | None = None,
        status_filter: str | None = None,
        verification_status: str | None = None,
        business_type: str | None = None,
        city: str | None = None,
        venue_owner_id: uuid.UUID | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        sort_by: str = "business_name",
        sort_dir: str = "asc",
        page: int = 1,
        page_size: int = 10,
    ) -> BusinessProfileListResponse:
        scoped_owner = await self._resolve_list_owner_filter(actor)
        owner_filter = scoped_owner if scoped_owner is not None else venue_owner_id
        date_from_dt = (
            datetime.combine(date_from, datetime.min.time()).astimezone()
            if date_from
            else None
        )
        date_to_dt = (
            datetime.combine(date_to, datetime.max.time()).astimezone()
            if date_to
            else None
        )
        rows, total = await self.repo.list_profiles(
            search=search,
            status=status_filter,
            verification_status=verification_status,
            business_type=business_type,
            city=city,
            venue_owner_id=owner_filter,
            date_from=date_from_dt,
            date_to=date_to_dt,
            sort_by=sort_by,
            sort_dir=sort_dir,
            page=page,
            page_size=page_size,
        )
        total_pages = max(1, math.ceil(total / page_size)) if page_size else 1
        return BusinessProfileListResponse(
            items=[self._to_list_item(p) for p in rows],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_profile(
        self, actor: User, profile_id: uuid.UUID
    ) -> BusinessProfileDetailResponse:
        profile = await self.repo.get_by_id(profile_id)
        if profile is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Business profile not found.",
            )
        self._assert_access(actor, profile)
        return await self._to_detail(profile)

    async def create_profile(
        self, actor: User, payload: BusinessProfileCreateRequest
    ) -> BusinessProfileMutationResponse:
        vendor = await self._vendor_owner(actor)
        venue_owner_id = payload.venue_owner_id
        if vendor is not None:
            venue_owner_id = vendor.id

        owner = await self.owners.get_by_id(venue_owner_id)
        if owner is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Venue owner not found.",
            )
        if vendor is None:
            # Admin creating — ok
            pass

        await self._assert_no_legal_duplicates(
            tenant_id=owner.tenant_id,
            gst_number=payload.gst_number,
            pan_number=payload.pan_number,
            business_registration_number=payload.business_registration_number,
        )

        bank_uploaded = (
            datetime.combine(payload.bank_proof_uploaded_date, datetime.min.time()).replace(
                tzinfo=UTC
            )
            if payload.bank_proof_uploaded_date
            else None
        )

        profile = BusinessProfile(
            tenant_id=owner.tenant_id,
            venue_owner_id=owner.id,
            business_code=await self.repo.next_business_code(),
            business_name=payload.business_name,
            legal_business_name=payload.legal_business_name,
            business_type=payload.business_type,
            years_in_business=payload.years_in_business,
            description=payload.description,
            website=payload.website,
            support_email=str(payload.support_email) if payload.support_email else None,
            support_phone=payload.support_phone,
            alternate_phone=payload.alternate_phone,
            address_line1=payload.address_line1,
            address_line2=payload.address_line2,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            postal_code=payload.postal_code,
            gst_number=payload.gst_number,
            pan_number=payload.pan_number,
            business_registration_number=payload.business_registration_number,
            account_holder_name=payload.account_holder_name,
            bank_name=payload.bank_name,
            account_number=payload.account_number,
            ifsc_code=payload.ifsc_code,
            cancelled_cheque_url=payload.cancelled_cheque_url,
            bank_proof_file_name=payload.bank_proof_file_name,
            bank_proof_file_size=payload.bank_proof_file_size,
            bank_proof_uploaded_at=bank_uploaded,
            verification_status=payload.verification_status,
            verification_notes=payload.verification_notes,
            status=payload.status,
            published_at=datetime.now(UTC) if payload.status == "active" else None,
            created_by=actor.id,
            updated_by=actor.id,
            documents=[],
        )
        if payload.documents:
            self._apply_document_inputs(profile, payload.documents)
        else:
            for slot in DOCUMENT_SLOTS:
                profile.documents.append(
                    BusinessProfileDocument(
                        document_type=slot,
                        name=slot,
                        status=BusinessDocumentStatus.PENDING.value,
                    )
                )

        profile = await self.repo.create(profile)
        await self.db.commit()
        profile = await self.repo.get_by_id(profile.id)
        assert profile is not None
        return BusinessProfileMutationResponse(
            message="Business profile created successfully.",
            business_profile=await self._to_detail(profile),
        )

    async def update_profile(
        self,
        actor: User,
        profile_id: uuid.UUID,
        payload: BusinessProfileUpdateRequest,
    ) -> BusinessProfileMutationResponse:
        profile = await self.repo.get_by_id(profile_id)
        if profile is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Business profile not found.",
            )
        self._assert_access(actor, profile)

        data = payload.model_dump(exclude_unset=True, exclude={"documents", "bank_proof_uploaded_date"})
        await self._assert_no_legal_duplicates(
            tenant_id=profile.tenant_id,
            gst_number=data.get("gst_number", profile.gst_number),
            pan_number=data.get("pan_number", profile.pan_number),
            business_registration_number=data.get(
                "business_registration_number", profile.business_registration_number
            ),
            exclude_id=profile.id,
        )

        if "support_email" in data and data["support_email"] is not None:
            data["support_email"] = str(data["support_email"])

        for key, value in data.items():
            setattr(profile, key, value)

        if "bank_proof_uploaded_date" in payload.model_fields_set:
            if payload.bank_proof_uploaded_date:
                profile.bank_proof_uploaded_at = datetime.combine(
                    payload.bank_proof_uploaded_date, datetime.min.time()
                ).replace(tzinfo=UTC)
            else:
                profile.bank_proof_uploaded_at = None

        if "status" in data and data["status"] == "active" and profile.published_at is None:
            profile.published_at = datetime.now(UTC)

        if payload.documents is not None:
            self._apply_document_inputs(profile, payload.documents)

        profile.updated_by = actor.id
        await self.db.commit()
        profile = await self.repo.get_by_id(profile.id)
        assert profile is not None
        return BusinessProfileMutationResponse(
            message="Business profile updated successfully.",
            business_profile=await self._to_detail(profile),
        )

    async def delete_profile(
        self, actor: User, profile_id: uuid.UUID
    ) -> MessageResponse:
        profile = await self.repo.get_by_id(profile_id)
        if profile is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Business profile not found.",
            )
        self._assert_access(actor, profile)

        # When venues module exists, block delete if active venues are linked.
        active_venues = 0
        if active_venues > 0:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="Cannot delete a business profile with active venues.",
            )

        await self.repo.soft_delete(profile, updated_by=actor.id)
        await self.db.commit()
        return MessageResponse(message="Business profile deleted successfully.")

    async def upload_document(
        self,
        actor: User,
        profile_id: uuid.UUID,
        *,
        document_type: str,
        name: str | None,
        upload: UploadFile,
    ) -> DocumentUploadResponse:
        profile = await self.repo.get_by_id(profile_id)
        if profile is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Business profile not found.",
            )
        self._assert_access(actor, profile)

        slot = document_type.strip()
        display_name = (name or slot).strip()
        file_name, file_size, file_url, mime = await save_upload_file(
            profile_id=profile.id, upload=upload, document_type=slot
        )

        existing = next(
            (
                d
                for d in self._active_documents(profile)
                if d.document_type == slot or d.name == slot
            ),
            None,
        )
        if existing:
            existing.file_name = file_name
            existing.file_size = file_size
            existing.file_url = file_url
            existing.mime_type = mime
            existing.status = BusinessDocumentStatus.UPLOADED.value
            existing.uploaded_at = datetime.now(UTC)
            existing.name = display_name
            doc = existing
        else:
            doc = BusinessProfileDocument(
                business_profile_id=profile.id,
                document_type=slot,
                name=display_name,
                file_name=file_name,
                file_size=file_size,
                file_url=file_url,
                mime_type=mime,
                status=BusinessDocumentStatus.UPLOADED.value,
                uploaded_at=datetime.now(UTC),
            )
            self.db.add(doc)

        if slot.lower().startswith("cancelled cheque"):
            profile.cancelled_cheque_url = file_url
            profile.bank_proof_file_name = file_name
            profile.bank_proof_file_size = file_size
            profile.bank_proof_uploaded_at = datetime.now(UTC)

        profile.updated_by = actor.id
        await self.db.commit()
        await self.db.refresh(doc)
        return DocumentUploadResponse(
            message="Document uploaded successfully.",
            document=self._doc_to_response(doc),
        )

    async def list_cities(self, actor: User) -> list[str]:
        _ = await self._resolve_list_owner_filter(actor)
        return await self.repo.distinct_cities()

    async def approve_profile(
        self, actor: User, profile_id: uuid.UUID
    ) -> BusinessProfileMutationResponse:
        if self.permissions.get_data_scope(actor) != DataScope.ALL:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Only admins can approve business profiles.",
            )
        profile = await self.repo.get_by_id(profile_id)
        if profile is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Business profile not found.",
            )
        profile.verification_status = "verified"
        profile.status = BusinessProfileStatus.ACTIVE.value
        profile.approved_by = actor.id
        profile.approved_at = datetime.now(UTC)
        profile.rejected_reason = None
        profile.published_at = profile.published_at or datetime.now(UTC)
        profile.updated_by = actor.id
        await self.db.commit()
        profile = await self.repo.get_by_id(profile.id)
        assert profile is not None
        return BusinessProfileMutationResponse(
            message="Business profile approved.",
            business_profile=await self._to_detail(profile),
        )

    async def reject_profile(
        self, actor: User, profile_id: uuid.UUID, reason: str | None = None
    ) -> BusinessProfileMutationResponse:
        if self.permissions.get_data_scope(actor) != DataScope.ALL:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Only admins can reject business profiles.",
            )
        profile = await self.repo.get_by_id(profile_id)
        if profile is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Business profile not found.",
            )
        profile.verification_status = "rejected"
        profile.rejected_reason = reason
        profile.updated_by = actor.id
        await self.db.commit()
        profile = await self.repo.get_by_id(profile.id)
        assert profile is not None
        return BusinessProfileMutationResponse(
            message="Business profile rejected.",
            business_profile=await self._to_detail(profile),
        )
