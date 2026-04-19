export default class ApiResponse {
  static success({ message = "Success", data = null, meta = null } = {}) {
    return {
      success: true,
      message,
      data,
      meta,
    };
  }

  static error({ message = "Error", errors = null } = {}) {
    return {
      success: false,
      message,
      errors,
    };
  }
}
