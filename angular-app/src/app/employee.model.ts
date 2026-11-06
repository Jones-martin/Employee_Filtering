export interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  salary: number;
  joinDate: string;
  status: string;
  email: string;
}

export interface EmployeeResponse {
  success: boolean;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: Employee[];
}
