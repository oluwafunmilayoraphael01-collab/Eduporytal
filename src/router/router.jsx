
import { createBrowserRouter } from "react-router-dom";

import AssignTeacher from "../pages/AssignTeacher";
import Home from "../pages/Home";
import Student from "../pages/Student";
import Login from "../pages/Login";
import RegisterSchool from "../pages/Registerschool";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "../components/ProtectedRouter";
import SchoolApplications from "../pages/SchoolApplications";
import EduportalAdminDashboard from "../pages/EduportalAdminDashboard";
import StudentDashboard from "../pages/StudentDashboard";
import StudentAttendance from "../pages/StudentAttendance";
import TeacherDashboard from "../pages/TeacherDashboard";
import Teachers from "../pages/Teacher";
import Attendance from "../pages/Attendance";
import TeacherResults from "../pages/Result";
import SchoolDashboard from "../pages/SchoodAdminDashboard";
import StudentLogin from "../pages/StudentLogin";
import SchoolFees from "../pages/SchoolFees";
import StudentResults from "../pages/StudentResults";
import SchoolBursary from "../pages/SchoolBursary";
import CreateBursar from "../pages/CreateBursar";
import BursarLogin from "../pages/BursarLogin";
import Result from "../pages/Result";

export const router = createBrowserRouter([
  // Public routes
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register-school",
    element: <RegisterSchool />,
  },
  {
    path: "/student-login",
    element: <StudentLogin />,
  },
  {
    path: "/bursary-login",
    element: <BursarLogin />,
  },

  // Super Admin routes
  {
    path: "/Eduportal-admin",
    element: <ProtectedRoute allowedRoles={["super_admin"]} />,
    children: [
      {
        index: true,
        element: <EduportalAdminDashboard />,
      },
      {
        path: "applications",
        element: <SchoolApplications />,
      },
    ],
  },

  // Student routes
  {
    path: "/student",
    element: <ProtectedRoute allowedRoles={["student"]} />,
    children: [
      {
        index: true,
        element: <StudentDashboard />,
      },
      {
        path: "results",
        element: <StudentResults />,
      },
      {
        path: "attendance",
        element: <StudentAttendance />,
      },
    ],
  },

  // Teacher routes
  {
    path: "/teacher",
    element: <ProtectedRoute allowedRoles={["teacher"]} />,
    children: [
      {
        index: true,
        element: <TeacherDashboard />,
      },
      {
        path: "results",
        element: <TeacherResults />,
      },
    ],
  },

  // Bursar routes
  {
    path: "/bursary",
    element: <ProtectedRoute allowedRoles={["bursar"]} />,
    children: [
      {
        index: true,
        element: <SchoolBursary />,
      },
    ],
  },

  // School routes
  {
    element: (
      <ProtectedRoute
        allowedRoles={["school_admin", "teacher", "student", "parent"]}
      />
    ),
    children: [
      {
        path: "/school",
        element: <SchoolDashboard />,
      },

      // Student management
      {
        path: "/school/students",
        element: <ProtectedRoute allowedRoles={["school_admin"]} />,
        children: [{ index: true, element: <Student /> }],
      },

      // School fees
      {
        path: "/school/students/fees",
        element: <ProtectedRoute allowedRoles={["school_admin"]} />,
        children: [{ index: true, element: <SchoolFees /> }],
      },

      // Create bursar
      {
        path: "/school/create-bursar",
        element: <ProtectedRoute allowedRoles={["school_admin"]} />,
        children: [{ index: true, element: <CreateBursar /> }],
      },

      // Teacher management
      {
        path: "/school/teachers",
        element: <ProtectedRoute allowedRoles={["school_admin"]} />,
        children: [{ index: true, element: <Teachers /> }],
      },

      // Assign teachers
      {
        path: "/school/assign-teacher",
        element: <ProtectedRoute allowedRoles={["school_admin"]} />,
        children: [{ index: true, element: <AssignTeacher /> }],
      },

      // School attendance
      {
        path: "/school/attendance",
        element: <Attendance />,
      },

      // School results
      {
        path: "/school/results",
        element: <Result />,
      },
    ],
  },

  // Router test
  {
    path: "/route-test",
    element: (
      <div className="p-10 text-center">
        <h1 className="text-3xl font-bold text-blue-600">
          EduPortal Router Is Working!
        </h1>
      </div>
    ),
  },

  // 404 page
  {
    path: "*",
    element: <NotFound />,
  },
]);
