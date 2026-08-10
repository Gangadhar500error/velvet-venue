"""Menu definitions for RBAC seeding — portal drives sidebar visibility per role."""

from dataclasses import dataclass


@dataclass(frozen=True)
class MenuDef:
    key: str
    label: str
    portal: str
    sort_order: int
    permission_code: str | None = None
    href: str | None = None
    icon: str | None = None
    parent_key: str | None = None


MENU_DEFINITIONS: list[MenuDef] = [
    # Admin portal
    MenuDef("admin_dashboard", "Dashboard", "admin", 1, "Dashboard.View", "/admin", "LayoutDashboard"),
    MenuDef("admin_users_section", "User Management", "admin", 10, "Customer.View", None, "Users"),
    MenuDef("admin_customers", "Customers", "admin", 11, "Customer.View", "/admin/customers", "UserRound", "admin_users_section"),
    MenuDef("admin_vendors", "Venue Owners", "admin", 12, "Vendor.View", "/admin/venue-owners", "Briefcase", "admin_users_section"),
    MenuDef("admin_venue_section", "Venue Management", "admin", 20, "Venue.View", None, "Building2"),
    MenuDef("admin_business", "Business Profiles", "admin", 21, "BusinessProfile.View", "/admin/business-profile", "Briefcase", "admin_venue_section"),
    MenuDef("admin_venues", "Venues", "admin", 22, "Venue.View", "/admin/venues", "Building2", "admin_venue_section"),
    MenuDef("admin_booking_section", "Booking Management", "admin", 30, "Booking.View", None, "CalendarDays"),
    MenuDef("admin_bookings", "Bookings", "admin", 31, "Booking.View", "/admin/bookings", "CalendarDays", "admin_booking_section"),
    MenuDef("admin_calendar", "Calendar", "admin", 32, "Booking.View", "/admin/calendar", "Calendar", "admin_booking_section"),
    MenuDef("admin_financial_section", "Financial", "admin", 40, "Payment.View", None, "Wallet"),
    MenuDef("admin_invoices", "Invoices", "admin", 41, "Invoice.View", "/admin/invoices", "FileText", "admin_financial_section"),
    MenuDef("admin_payments", "Payments", "admin", 42, "Payment.View", "/admin/transactions", "Banknote", "admin_financial_section"),
    MenuDef("admin_reports", "Reports", "admin", 50, "Report.View", "/admin/reports", "BarChart3"),
    MenuDef("admin_settings", "Settings", "admin", 60, "Settings.View", "/admin/settings/profile", "Settings"),
    # Vendor portal
    MenuDef("vendor_dashboard", "Dashboard", "vendor", 1, "Dashboard.View", "/admin", "LayoutDashboard"),
    MenuDef("vendor_business", "Business Profile", "vendor", 10, "BusinessProfile.View", "/admin/business-profile", "Briefcase"),
    MenuDef("vendor_venues", "Venues", "vendor", 20, "Venue.View", "/admin/venues", "Building2"),
    MenuDef("vendor_availability", "Availability", "vendor", 30, "Availability.View", "/admin/calendar", "Calendar"),
    MenuDef("vendor_bookings", "Bookings", "vendor", 40, "Booking.View", "/admin/bookings", "CalendarDays"),
    MenuDef("vendor_customers", "Customers", "vendor", 50, "Customer.View", "/admin/customers", "UserRound"),
    MenuDef("vendor_invoices", "Invoices", "vendor", 60, "Invoice.View", "/admin/invoices", "FileText"),
    MenuDef("vendor_payments", "Payments", "vendor", 70, "Payment.View", "/admin/transactions", "Wallet"),
    MenuDef("vendor_settings", "Settings", "vendor", 80, "Settings.View", "/admin/settings/profile", "Settings"),
    # Customer portal
    MenuDef("customer_dashboard", "Dashboard", "customer", 1, "Dashboard.View", "/admin", "LayoutDashboard"),
    MenuDef("customer_bookings", "My Bookings", "customer", 10, "Booking.View", "/admin/bookings", "CalendarDays"),
    MenuDef("customer_wishlist", "Wishlist", "customer", 20, "Wishlist.View", "/admin/wishlist", "Heart"),
    MenuDef("customer_invoices", "Invoices", "customer", 30, "Invoice.View", "/admin/invoices", "FileText"),
    MenuDef("customer_reviews", "Reviews", "customer", 40, "Review.View", "/admin/reviews", "Star"),
    MenuDef("customer_notifications", "Notifications", "customer", 50, "Notification.View", "/admin/settings/notifications", "Bell"),
    MenuDef("customer_profile", "Profile", "customer", 60, "Profile.View", "/admin/settings/profile", "UserRound"),
]

ROLE_PORTAL_MAP = {
    "admin": "admin",
    "vendor": "vendor",
    "customer": "customer",
}
