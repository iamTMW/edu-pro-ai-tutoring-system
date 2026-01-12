// API utility functions for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Return error object instead of throwing
      return {
        success: false,
        error: data.message || 'API request failed',
      };
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    // Return error object instead of throwing
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Auth APIs
 */
export const authAPI = {
  /**
   * Login user
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{success: boolean, userid: string, username: string, role: string, message: string}>}
   */
  login: async (username, password) => {
    return apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  /**
   * Sign up new user
   * @param {Object} userData - {username, password, role, email?, first_name?, last_name?, parent_code?}
   * @returns {Promise<{success: boolean, userid: string, username: string, role: string, message: string}>}
   */
  signup: async (userData) => {
    return apiRequest('/new-user-setup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Change password
   * @param {string} username
   * @param {string} old_password
   * @param {string} new_password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  changePassword: async (username, old_password, new_password) => {
    return apiRequest('/change-password', {
      method: 'POST',
      body: JSON.stringify({ username, old_password, new_password }),
    });
  },

  /**
   * Fetch a security question for password recovery
   * @param {string} username
   * @returns {Promise<{success: boolean, question?: string, message?: string}>}
   */
  forgotPasswordQuestion: async (username) => {
    return apiRequest('/forgot-password/question', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  /**
   * Reset password after answering security question
   * @param {string} username
   * @param {string} answer
   * @param {string} new_password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  resetPassword: async (username, answer, new_password) => {
    return apiRequest('/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify({ username, answer, new_password }),
    });
  },

  /**
   * Recover username (optional if you want backend support)
   * @param {Object} userData - {email, first_name, last_name}
   * @returns {Promise<{success: boolean, username?: string, message?: string}>}
   */
  forgotUsername: async (userData) => {
    return apiRequest('/forgot-username', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

/**
 * User Profile APIs
 */
export const userAPI = {
  /**
   * Get user profile and classes
   * @param {string} userid
   * @returns {Promise<{success: boolean, profile: Object, classes: Array}>}
   */
  getProfile: async (userid) => {
    return apiRequest('/profile', {
      method: 'POST',
      body: JSON.stringify({ userid }),
    });
  },

  /**
   * Get user theme
   * @param {string} userid
   * @returns {Promise<{success: boolean, theme: string}>}
   */
  getTheme: async (userid) => {
    return apiRequest('/user/theme', {
      method: 'GET',
      body: JSON.stringify({ userid }),
    });
  },

  /**
   * Update user theme
   * @param {string} userid
   * @param {string} theme
   * @returns {Promise<{success: boolean, message: string}>}
   */
  updateTheme: async (userid, theme) => {
    return apiRequest('/user/theme', {
      method: 'POST',
      body: JSON.stringify({ userid, theme }),
    });
  },
};

/**
 * Student APIs
 */
export const studentAPI = {
  /**
   * Get student's classes
   * @param {string} userid
   * @returns {Promise<{success: boolean, classes: Array}>}
   */
  getClasses: async (userid) => {
    return apiRequest('/student/classes', {
      method: 'POST',
      body: JSON.stringify({ userid }),
    });
  },

  /**
   * Join a class
   * @param {string} student_userid
   * @param {string} class_id
   * @returns {Promise<{success: boolean, message: string}>}
   */
  joinClass: async (student_userid, class_id) => {
    return apiRequest('/student/join-class', {
      method: 'POST',
      body: JSON.stringify({ student_userid, class_id }),
    });
  },

  /**
   * Leave a class
   * @param {string} student_userid
   * @param {string} class_id
   * @returns {Promise<{success: boolean, message: string}>}
   */
  leaveClass: async (student_userid, class_id) => {
    return apiRequest('/student/leave-class', {
      method: 'POST',
      body: JSON.stringify({ student_userid, class_id }),
    });
  },

  /**
   * Get student progress in a class
   * @param {string} userid
   * @param {string} class_id
   * @returns {Promise<{success: boolean, progress: Object}>}
   */
  getProgress: async (userid, class_id) => {
    const params = new URLSearchParams({ userid, class_id });
    return apiRequest(`/student/get-progress?${params}`);
  },

  /**
   * Update question answer
   * @param {Object} data - {userid, class_id, lesson_id, question_id, correct, time_taken}
   * @returns {Promise<{success: boolean, message: string}>}
   */
  updateQuestion: async (data) => {
    return apiRequest('/student/update-question', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Complete a lesson
   * @param {string} userid
   * @param {string} class_id
   * @param {string} lesson_id
   * @returns {Promise<{success: boolean, completed_lesson: string, unlocked_lesson?: string, message: string}>}
   */
  completeLesson: async (userid, class_id, lesson_id) => {
    return apiRequest('/student/complete-lesson', {
      method: 'POST',
      body: JSON.stringify({ userid, class_id, lesson_id }),
    });
  },
};

/**
 * Lesson Content APIs
 */
export const lessonAPI = {
  /**
   * Get lesson HTML content
   * @param {string} class_id
   * @param {string} lesson_id
   * @returns {Promise<{success: boolean, lesson_id: string, html: string}>}
   */
  getLessonContent: async (class_id, lesson_id) => {
    return apiRequest('/lesson-content', {
      method: 'POST',
      body: JSON.stringify({ class_id, lesson_id }),
    });
  },

  /**
   * Get available themes
   * @returns {Promise<Array<string>>}
   */
  getAvailableThemes: async () => {
    const response = await fetch(`${API_BASE_URL}/available-themes`);
    return response.json();
  },
};

/**
 * Teacher APIs
 */
export const teacherAPI = {
  /**
   * Get teacher's classes
   * @param {string} userid
   * @returns {Promise<{success: boolean, classes: Array}>}
   */
  getClasses: async (userid) => {
    return apiRequest('/teacher/classes', {
      method: 'POST',
      body: JSON.stringify({ userid }),
    });
  },

  /**
   * Get students in a class
   * @param {string} class_id
   * @returns {Promise<{success: boolean, students: Array}>}
   */
  getStudents: async (class_id) => {
    return apiRequest('/teacher/students', {
      method: 'POST',
      body: JSON.stringify({ class_id }),
    });
  },

  /**
   * Get class progress for all students
   * @param {string} class_id
   * @returns {Promise<{success: boolean, students_progress: Object}>}
   */
  getProgress: async (class_id) => {
    return apiRequest('/teacher/progress', {
      method: 'POST',
      body: JSON.stringify({ class_id }),
    });
  },

  /**
   * Delete a class
   * @param {string} userid
   * @param {string} class_id
   * @returns {Promise<{success: boolean, message: string}>}
   */
  deleteClass: async (userid, class_id) => {
    return apiRequest('/teacher/delete-class', {
      method: 'POST',
      body: JSON.stringify({ userid, class_id }),
    });
  },

  /**
   * Create a new class
   * @param {FormData} formData - Must include: userid, class_name, description, template (JSON), HTML files
   * @returns {Promise<{success: boolean, class_id: string}>}
   */
  createClass: async (formData) => {
    const url = `${API_BASE_URL}/teacher/create-class`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData, // multipart/form-data
    });
    return response.json();
  },
};

export default {
  auth: authAPI,
  user: userAPI,
  student: studentAPI,
  lesson: lessonAPI,
  teacher: teacherAPI,
};
