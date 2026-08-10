"""Central permission definitions for RBAC seeding and documentation."""

from dataclasses import dataclass


@dataclass(frozen=True)
class PermissionDef:
    code: str
    module: str
    action: str
    name: str
    description: str = ""


def _p(module: str, action: str, name: str | None = None) -> PermissionDef:
    code = f"{module}.{action}"
    return PermissionDef(
        code=code,
        module=module,
        action=action,
        name=name or code.replace(".", " "),
    )


# Dashboard
DASHBOARD_VIEW = _p("Dashboard", "View", "View Dashboard")

# Users / Vendors / Customers (admin user management)
USER_VIEW = _p("User", "View", "View Users")
USER_CREATE = _p("User", "Create", "Create Users")
USER_UPDATE = _p("User", "Update", "Update Users")
USER_DELETE = _p("User", "Delete", "Delete Users")
USER_EXPORT = _p("User", "Export", "Export Users")

VENDOR_VIEW = _p("Vendor", "View", "View Vendors")
VENDOR_CREATE = _p("Vendor", "Create", "Create Vendors")
VENDOR_UPDATE = _p("Vendor", "Update", "Update Vendors")
VENDOR_DELETE = _p("Vendor", "Delete", "Delete Vendors")
VENDOR_APPROVE = _p("Vendor", "Approve", "Approve Vendors")
VENDOR_REJECT = _p("Vendor", "Reject", "Reject Vendors")
VENDOR_EXPORT = _p("Vendor", "Export", "Export Vendors")

CUSTOMER_VIEW = _p("Customer", "View", "View Customers")
CUSTOMER_CREATE = _p("Customer", "Create", "Create Customers")
CUSTOMER_UPDATE = _p("Customer", "Update", "Update Customers")
CUSTOMER_DELETE = _p("Customer", "Delete", "Delete Customers")
CUSTOMER_EXPORT = _p("Customer", "Export", "Export Customers")

# Business Profile
BUSINESS_PROFILE_VIEW = _p("BusinessProfile", "View", "View Business Profile")
BUSINESS_PROFILE_CREATE = _p("BusinessProfile", "Create", "Create Business Profile")
BUSINESS_PROFILE_UPDATE = _p("BusinessProfile", "Update", "Update Business Profile")
BUSINESS_PROFILE_DELETE = _p("BusinessProfile", "Delete", "Delete Business Profile")

# Venue
VENUE_VIEW = _p("Venue", "View", "View Venues")
VENUE_CREATE = _p("Venue", "Create", "Create Venues")
VENUE_UPDATE = _p("Venue", "Update", "Update Venues")
VENUE_DELETE = _p("Venue", "Delete", "Delete Venues")
VENUE_APPROVE = _p("Venue", "Approve", "Approve Venues")
VENUE_REJECT = _p("Venue", "Reject", "Reject Venues")
VENUE_EXPORT = _p("Venue", "Export", "Export Venues")

# Availability
AVAILABILITY_VIEW = _p("Availability", "View", "View Availability")
AVAILABILITY_UPDATE = _p("Availability", "Update", "Update Availability")

# Booking
BOOKING_VIEW = _p("Booking", "View", "View Bookings")
BOOKING_CREATE = _p("Booking", "Create", "Create Bookings")
BOOKING_UPDATE = _p("Booking", "Update", "Update Bookings")
BOOKING_DELETE = _p("Booking", "Delete", "Delete Bookings")
BOOKING_CANCEL = _p("Booking", "Cancel", "Cancel Bookings")
BOOKING_APPROVE = _p("Booking", "Approve", "Approve Bookings")
BOOKING_REJECT = _p("Booking", "Reject", "Reject Bookings")
BOOKING_EXPORT = _p("Booking", "Export", "Export Bookings")
BOOKING_ASSIGN = _p("Booking", "Assign", "Assign Bookings")

# Invoice
INVOICE_VIEW = _p("Invoice", "View", "View Invoices")
INVOICE_GENERATE = _p("Invoice", "Generate", "Generate Invoices")
INVOICE_DOWNLOAD = _p("Invoice", "Download", "Download Invoices")
INVOICE_EXPORT = _p("Invoice", "Export", "Export Invoices")

# Payment
PAYMENT_VIEW = _p("Payment", "View", "View Payments")
PAYMENT_REFUND = _p("Payment", "Refund", "Refund Payments")
PAYMENT_EXPORT = _p("Payment", "Export", "Export Payments")

# Category / Amenity / City
CATEGORY_VIEW = _p("Category", "View", "View Categories")
CATEGORY_CREATE = _p("Category", "Create", "Create Categories")
CATEGORY_UPDATE = _p("Category", "Update", "Update Categories")
CATEGORY_DELETE = _p("Category", "Delete", "Delete Categories")

AMENITY_VIEW = _p("Amenity", "View", "View Amenities")
AMENITY_CREATE = _p("Amenity", "Create", "Create Amenities")
AMENITY_UPDATE = _p("Amenity", "Update", "Update Amenities")
AMENITY_DELETE = _p("Amenity", "Delete", "Delete Amenities")

CITY_VIEW = _p("City", "View", "View Cities")
CITY_CREATE = _p("City", "Create", "Create Cities")
CITY_UPDATE = _p("City", "Update", "Update Cities")
CITY_DELETE = _p("City", "Delete", "Delete Cities")

# Review
REVIEW_VIEW = _p("Review", "View", "View Reviews")
REVIEW_CREATE = _p("Review", "Create", "Create Reviews")
REVIEW_UPDATE = _p("Review", "Update", "Update Reviews")
REVIEW_DELETE = _p("Review", "Delete", "Delete Reviews")
REVIEW_APPROVE = _p("Review", "Approve", "Approve Reviews")
REVIEW_REJECT = _p("Review", "Reject", "Reject Reviews")

# Report / CMS
REPORT_VIEW = _p("Report", "View", "View Reports")
REPORT_EXPORT = _p("Report", "Export", "Export Reports")

CMS_VIEW = _p("CMS", "View", "View CMS")
CMS_UPDATE = _p("CMS", "Update", "Update CMS")

# Settings
SETTINGS_VIEW = _p("Settings", "View", "View Settings")
SETTINGS_UPDATE = _p("Settings", "Update", "Update Settings")

# Customer portal
WISHLIST_VIEW = _p("Wishlist", "View", "View Wishlist")
WISHLIST_UPDATE = _p("Wishlist", "Update", "Update Wishlist")

NOTIFICATION_VIEW = _p("Notification", "View", "View Notifications")

PROFILE_VIEW = _p("Profile", "View", "View Profile")
PROFILE_UPDATE = _p("Profile", "Update", "Update Profile")

# RBAC admin (future)
RBAC_VIEW = _p("RBAC", "View", "View Roles & Permissions")
RBAC_UPDATE = _p("RBAC", "Update", "Manage Roles & Permissions")

ALL_PERMISSIONS: list[PermissionDef] = [
    DASHBOARD_VIEW,
    USER_VIEW, USER_CREATE, USER_UPDATE, USER_DELETE, USER_EXPORT,
    VENDOR_VIEW, VENDOR_CREATE, VENDOR_UPDATE, VENDOR_DELETE, VENDOR_APPROVE, VENDOR_REJECT, VENDOR_EXPORT,
    CUSTOMER_VIEW, CUSTOMER_CREATE, CUSTOMER_UPDATE, CUSTOMER_DELETE, CUSTOMER_EXPORT,
    BUSINESS_PROFILE_VIEW, BUSINESS_PROFILE_CREATE, BUSINESS_PROFILE_UPDATE, BUSINESS_PROFILE_DELETE,
    VENUE_VIEW, VENUE_CREATE, VENUE_UPDATE, VENUE_DELETE, VENUE_APPROVE, VENUE_REJECT, VENUE_EXPORT,
    AVAILABILITY_VIEW, AVAILABILITY_UPDATE,
    BOOKING_VIEW, BOOKING_CREATE, BOOKING_UPDATE, BOOKING_DELETE, BOOKING_CANCEL,
    BOOKING_APPROVE, BOOKING_REJECT, BOOKING_EXPORT, BOOKING_ASSIGN,
    INVOICE_VIEW, INVOICE_GENERATE, INVOICE_DOWNLOAD, INVOICE_EXPORT,
    PAYMENT_VIEW, PAYMENT_REFUND, PAYMENT_EXPORT,
    CATEGORY_VIEW, CATEGORY_CREATE, CATEGORY_UPDATE, CATEGORY_DELETE,
    AMENITY_VIEW, AMENITY_CREATE, AMENITY_UPDATE, AMENITY_DELETE,
    CITY_VIEW, CITY_CREATE, CITY_UPDATE, CITY_DELETE,
    REVIEW_VIEW, REVIEW_CREATE, REVIEW_UPDATE, REVIEW_DELETE, REVIEW_APPROVE, REVIEW_REJECT,
    REPORT_VIEW, REPORT_EXPORT,
    CMS_VIEW, CMS_UPDATE,
    SETTINGS_VIEW, SETTINGS_UPDATE,
    WISHLIST_VIEW, WISHLIST_UPDATE,
    NOTIFICATION_VIEW,
    PROFILE_VIEW, PROFILE_UPDATE,
    RBAC_VIEW, RBAC_UPDATE,
]

ADMIN_PERMISSIONS = [p.code for p in ALL_PERMISSIONS]

VENDOR_PERMISSIONS = [
    DASHBOARD_VIEW.code,
    BUSINESS_PROFILE_VIEW.code, BUSINESS_PROFILE_CREATE.code, BUSINESS_PROFILE_UPDATE.code,
    VENUE_VIEW.code, VENUE_CREATE.code, VENUE_UPDATE.code, VENUE_DELETE.code,
    AVAILABILITY_VIEW.code, AVAILABILITY_UPDATE.code,
    BOOKING_VIEW.code, BOOKING_UPDATE.code, BOOKING_APPROVE.code, BOOKING_REJECT.code,
    CUSTOMER_VIEW.code,
    INVOICE_VIEW.code, INVOICE_GENERATE.code, INVOICE_DOWNLOAD.code,
    PAYMENT_VIEW.code, PAYMENT_EXPORT.code,
    REVIEW_VIEW.code, REVIEW_UPDATE.code,
    SETTINGS_VIEW.code, SETTINGS_UPDATE.code,
    PROFILE_VIEW.code, PROFILE_UPDATE.code,
    NOTIFICATION_VIEW.code,
]

CUSTOMER_PERMISSIONS = [
    DASHBOARD_VIEW.code,
    VENUE_VIEW.code,
    BOOKING_VIEW.code, BOOKING_CREATE.code, BOOKING_CANCEL.code,
    WISHLIST_VIEW.code, WISHLIST_UPDATE.code,
    INVOICE_VIEW.code, INVOICE_DOWNLOAD.code,
    PAYMENT_VIEW.code,
    REVIEW_VIEW.code, REVIEW_CREATE.code, REVIEW_UPDATE.code,
    NOTIFICATION_VIEW.code,
    PROFILE_VIEW.code, PROFILE_UPDATE.code,
]

ROLE_PERMISSION_MAP = {
    "admin": ADMIN_PERMISSIONS,
    "vendor": VENDOR_PERMISSIONS,
    "customer": CUSTOMER_PERMISSIONS,
}

# Route → required permission for frontend/backend route guards
ROUTE_PERMISSIONS: dict[str, str] = {
    "/admin": DASHBOARD_VIEW.code,
    "/admin/customers": CUSTOMER_VIEW.code,
    "/admin/venue-owners": VENDOR_VIEW.code,
    "/admin/business-profile": BUSINESS_PROFILE_VIEW.code,
    "/admin/venues": VENUE_VIEW.code,
    "/admin/bookings": BOOKING_VIEW.code,
    "/admin/calendar": BOOKING_VIEW.code,
    "/admin/invoices": INVOICE_VIEW.code,
    "/admin/transactions": PAYMENT_VIEW.code,
    "/admin/reports": REPORT_VIEW.code,
    "/admin/settings": SETTINGS_VIEW.code,
    "/admin/settings/profile": PROFILE_VIEW.code,
    "/admin/settings/security": SETTINGS_VIEW.code,
    "/admin/settings/notifications": NOTIFICATION_VIEW.code,
    "/admin/wishlist": WISHLIST_VIEW.code,
    "/admin/reviews": REVIEW_VIEW.code,
}

# Dashboard widgets per permission
DASHBOARD_WIDGETS: dict[str, list[str]] = {
    "admin": [
        "total_users", "total_vendors", "total_customers", "pending_venues",
        "approved_venues", "revenue", "bookings", "recent_activities", "analytics",
    ],
    "vendor": [
        "my_venues", "todays_bookings", "upcoming_bookings", "revenue",
        "pending_requests", "customer_reviews", "availability",
    ],
    "customer": [
        "upcoming_events", "past_bookings", "wishlist", "payments",
        "invoices", "notifications", "profile",
    ],
}

WIDGET_PERMISSIONS: dict[str, str | None] = {
    "total_users": USER_VIEW.code,
    "total_vendors": VENDOR_VIEW.code,
    "total_customers": CUSTOMER_VIEW.code,
    "pending_venues": VENUE_APPROVE.code,
    "approved_venues": VENUE_VIEW.code,
    "revenue": PAYMENT_VIEW.code,
    "bookings": BOOKING_VIEW.code,
    "recent_activities": DASHBOARD_VIEW.code,
    "analytics": REPORT_VIEW.code,
    "my_venues": VENUE_VIEW.code,
    "todays_bookings": BOOKING_VIEW.code,
    "upcoming_bookings": BOOKING_VIEW.code,
    "pending_requests": BOOKING_VIEW.code,
    "customer_reviews": REVIEW_VIEW.code,
    "availability": AVAILABILITY_VIEW.code,
    "upcoming_events": BOOKING_VIEW.code,
    "past_bookings": BOOKING_VIEW.code,
    "wishlist": WISHLIST_VIEW.code,
    "payments": PAYMENT_VIEW.code,
    "invoices": INVOICE_VIEW.code,
    "notifications": NOTIFICATION_VIEW.code,
    "profile": PROFILE_VIEW.code,
}
