import { PropertyFormData, WorkspaceType } from "@/types/property";

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validation rules for property form
 * This helps backend developers understand required fields
 */
export const validateSection = (section: string, formData: PropertyFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  switch (section) {
    case "basic":
      if (!formData.propertyName?.trim()) {
        errors.propertyName = "Property name is required";
      }
      if (!formData.workspaceType) {
        errors.workspaceType = "Workspace type is required";
      }
      break;

    case "location":
      if (!formData.country?.trim()) {
        errors.country = "Country is required";
      }
      if (!formData.state?.trim()) {
        errors.state = "State is required";
      }
      if (!formData.city?.trim()) {
        errors.city = "City is required";
      }
      if (!formData.areaLocality?.trim()) {
        errors.areaLocality = "Area/Locality is required";
      }
      if (!formData.fullAddress?.trim()) {
        errors.fullAddress = "Full address is required";
      }
      break;

    case "media":
      // Cover image is recommended but not strictly required
      // Gallery images are optional
      break;

    case "availability":
      // Opening/closing time and working days are optional
      // Can be 24x7 available
      break;

    case "contact":
      if (!formData.contactPersonName?.trim()) {
        errors.contactPersonName = "Contact person name is required";
      }
      if (!formData.phoneNumber?.trim()) {
        errors.phoneNumber = "Phone number is required";
      }
      if (!formData.emailId?.trim()) {
        errors.emailId = "Email ID is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
        errors.emailId = "Please enter a valid email address";
      }
      break;

    case "legal":
      // GST number is conditional - required only if GST registered is "yes"
      if (formData.gstRegistered === "yes" && !formData.gstNumber?.trim()) {
        errors.gstNumber = "GST number is required when GST registered is Yes";
      }
      break;

    case "amenities":
      // All amenities are optional
      break;

    case "typeSpecific":
      // Type-specific validation based on workspace type
      if (!formData.workspaceType) {
        errors.workspaceType = "Please select workspace type first";
        break;
      }

      switch (formData.workspaceType as WorkspaceType) {
        case "Coworking":
          if (!formData.totalSeats?.trim()) {
            errors.totalSeats = "Total seats is required";
          }
          if (!formData.dailyPrice?.trim()) {
            errors.dailyPrice = "Daily price is required";
          }
          if (!formData.monthlyPrice?.trim()) {
            errors.monthlyPrice = "Monthly price is required";
          }
          break;

        case "Private Office":
          if (!formData.privateOfficeMonthlyRent?.trim()) {
            errors.privateOfficeMonthlyRent = "Monthly rent is required";
          }
          break;

        case "Meeting Room":
          if (!formData.roomName?.trim()) {
            errors.roomName = "Room name is required";
          }
          if (!formData.seatingCapacity?.trim()) {
            errors.seatingCapacity = "Seating capacity is required";
          }
          if (!formData.hourlyPrice?.trim()) {
            errors.hourlyPrice = "Hourly price is required";
          }
          break;

        case "Virtual Office":
          if (!formData.businessAddress?.trim()) {
            errors.businessAddress = "Business address is required";
          }
          if (!formData.virtualOfficeCity?.trim()) {
            errors.virtualOfficeCity = "City is required";
          }
          if (!formData.virtualOfficeMonthlyPrice?.trim()) {
            errors.virtualOfficeMonthlyPrice = "Monthly price is required";
          }
          break;
      }
      break;

    case "admin":
      // Property status and verification status are required
      if (!formData.propertyStatus) {
        errors.propertyStatus = "Property status is required";
      }
      if (!formData.verificationStatus) {
        errors.verificationStatus = "Verification status is required";
      }
      break;

    case "seo":
      // SEO fields are optional but recommended
      break;
  }

  return errors;
};

/**
 * Validate entire form before submission
 */
export const validateForm = (formData: PropertyFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  const sections = ["basic", "location", "contact", "legal", "typeSpecific", "admin"];

  sections.forEach((section) => {
    const sectionErrors = validateSection(section, formData);
    Object.assign(errors, sectionErrors);
  });

  return errors;
};

/**
 * Get required fields list for backend reference
 */
export const getRequiredFields = (workspaceType?: WorkspaceType): string[] => {
  const baseRequired = [
    "propertyName",
    "workspaceType",
    "country",
    "state",
    "city",
    "areaLocality",
    "fullAddress",
    "contactPersonName",
    "phoneNumber",
    "emailId",
    "propertyStatus",
    "verificationStatus",
  ];

  const typeSpecificRequired: Record<WorkspaceType, string[]> = {
    Coworking: ["totalSeats", "dailyPrice", "monthlyPrice"],
    "Private Office": ["privateOfficeMonthlyRent"],
    "Meeting Room": ["roomName", "seatingCapacity", "hourlyPrice"],
    "Virtual Office": ["businessAddress", "virtualOfficeCity", "virtualOfficeMonthlyPrice"],
  };

  if (workspaceType && typeSpecificRequired[workspaceType]) {
    return [...baseRequired, ...typeSpecificRequired[workspaceType]];
  }

  return baseRequired;
};

