import { useState } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { AdminStudentView } from "@/components/student/AdminStudentView";
import { useAuth } from "@/components/auth/AuthProvider";
import StudentDashboard from "./StudentDashboard";
import StudentPlan from "./StudentPlan";
import StudentCheckIn from "./StudentCheckIn";

export default function StudentArea() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { profile } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <StudentDashboard />;
      case 'plan':
        return <StudentPlan />;
      case 'checkin':
        return <StudentCheckIn />;
      default:
        return <StudentDashboard />;
    }
  };

  // If user is admin, show admin view of student area
  if (profile?.role === 'admin') {
    return (
      <AdminStudentView 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
      >
        {renderPage()}
      </AdminStudentView>
    );
  }

  // If user is student, show normal student layout
  return (
    <StudentLayout 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
    >
      {renderPage()}
    </StudentLayout>
  );
}
