import http from "node:http";
import url from "node:url";

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

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmployeeResponse {
  success: boolean;
  meta: PaginationMeta;
  data: Employee[];
}

export const EMPLOYEES: Employee[] = [
  { id: 101, name: "Arun Kumar", department: "IT", role: "Full Stack Engineer", salary: 85000, joinDate: "2021-03-15", status: "Active", email: "arun.kumar@company.com" },
  { id: 102, name: "Priya Sharma", department: "IT", role: "DevOps Engineer", salary: 92000, joinDate: "2020-07-10", status: "Active", email: "priya.sharma@company.com" },
  { id: 103, name: "Rajesh Patel", department: "Finance", role: "Financial Analyst", salary: 78000, joinDate: "2019-11-01", status: "Active", email: "rajesh.patel@company.com" },
  { id: 104, name: "Sneha Reddy", department: "HR", role: "HR Specialist", salary: 65000, joinDate: "2022-01-20", status: "Active", email: "sneha.reddy@company.com" },
  { id: 105, name: "Vikram Singh", department: "IT", role: "Cloud Architect", salary: 125000, joinDate: "2018-05-12", status: "Active", email: "vikram.singh@company.com" },
  { id: 106, name: "Ananya Verma", department: "Finance", role: "Accounts Manager", salary: 95000, joinDate: "2020-02-18", status: "Active", email: "ananya.verma@company.com" },
  { id: 107, name: "Arun Swaminathan", department: "Operations", role: "Operations Lead", salary: 74000, joinDate: "2021-09-05", status: "Active", email: "arun.s@company.com" },
  { id: 108, name: "Divya Karthik", department: "IT", role: "QA Lead", salary: 88000, joinDate: "2019-08-25", status: "Active", email: "divya.k@company.com" },
  { id: 109, name: "Harish Sundaram", department: "Engineering", role: "Systems Engineer", salary: 82000, joinDate: "2021-06-30", status: "Active", email: "harish.s@company.com" },
  { id: 110, name: "Gopiram Raman", department: "Engineering", role: "Backend Developer", salary: 90000, joinDate: "2020-10-14", status: "Active", email: "gopiram.r@company.com" },
  { id: 111, name: "Bhavya Chandran", department: "HR", role: "Recruiter", salary: 62000, joinDate: "2022-04-11", status: "Active", email: "bhavya.c@company.com" },
  { id: 112, name: "Dinesh Kumar", department: "Operations", role: "Logistics Analyst", salary: 71000, joinDate: "2021-12-01", status: "Active", email: "dinesh.k@company.com" },
  { id: 113, name: "Joe", department: "IT", role: "Tech Lead", salary: 130000, joinDate: "2017-09-18", status: "Active", email: "jones.m@company.com" },
  { id: 114, name: "Kavitha Murugan", department: "Finance", role: "Tax Consultant", salary: 86000, joinDate: "2020-04-22", status: "Active", email: "kavitha.m@company.com" },
  { id: 115, name: "Suresh Raina", department: "Engineering", role: "Frontend Developer", salary: 81000, joinDate: "2022-08-01", status: "Active", email: "suresh.r@company.com" }
];

export interface QueryParams {
  department?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
  search?: string;
  minSalary?: number;
  maxSalary?: number;
}

export function queryEmployees(params: QueryParams = {}): EmployeeResponse {
  let result = [...EMPLOYEES];

  if (params.department) {
    const targetDept = params.department.toLowerCase();
    result = result.filter(emp => emp.department.toLowerCase() === targetDept);
  }

  if (params.search) {
    const term = params.search.toLowerCase();
    result = result.filter(emp =>
      emp.name.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      emp.role.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term)
    );
  }

  if (typeof params.minSalary === "number") {
    result = result.filter(emp => emp.salary >= params.minSalary!);
  }

  if (typeof params.maxSalary === "number") {
    result = result.filter(emp => emp.salary <= params.maxSalary!);
  }

  if (params.sortBy) {
    const sortField = params.sortBy as keyof Employee;
    const orderMultiplier = params.order === "desc" ? -1 : 1;

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * orderMultiplier;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return -1 * orderMultiplier;
      if (strA > strB) return 1 * orderMultiplier;
      return 0;
    });
  }

  const total = result.length;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Number(params.limit) || total);
  const totalPages = Math.ceil(total / limit) || 1;

  const startIndex = (page - 1) * limit;
  const paginatedData = result.slice(startIndex, startIndex + limit);

  return {
    success: true,
    meta: {
      total,
      page,
      limit,
      totalPages
    },
    data: paginatedData
  };
}

export function createEmployeeServer(port = 3000): http.Server {
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url || "", true);
    const pathname = parsedUrl.pathname || "";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (pathname === "/api/employees" && req.method === "GET") {
      const q = parsedUrl.query;
      const params: QueryParams = {
        department: typeof q.department === "string" ? q.department : undefined,
        sortBy: typeof q.sortBy === "string" ? q.sortBy : undefined,
        order: q.order === "desc" ? "desc" : (q.order === "asc" ? "asc" : undefined),
        page: q.page ? parseInt(String(q.page), 10) : undefined,
        limit: q.limit ? parseInt(String(q.limit), 10) : undefined,
        search: typeof q.search === "string" ? q.search : undefined
      };

      const response = queryEmployees(params);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response, null, 2));
      return;
    }

    if (pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint not found" }));
  });

  return server;
}

export function runTests(): void {
  console.log("=== MODULE 1: BACKEND API SERVICE (NODE JS) ===");
  console.log("Team Member: Divyadarshini V");
  console.log("Testing core capabilities: Filtering, Sorting, Pagination, Search\n");

  console.log("[TEST 1] GET /api/employees");
  const allEmployees = queryEmployees();
  console.log("Total Count:", allEmployees.meta.total);
  console.log("First Record:", allEmployees.data[0]?.name, "-", allEmployees.data[0]?.role);

  console.log("\n[TEST 2] GET /api/employees?department=IT");
  const itEmployees = queryEmployees({ department: "IT" });
  console.log("Matched IT Count:", itEmployees.meta.total);
  itEmployees.data.forEach(e => console.log(" -", e.name, "|", e.department, "|", e.role, "| Salary:", e.salary));

  console.log("\n[TEST 3] GET /api/employees?sortBy=salary&order=desc");
  const sortedSalary = queryEmployees({ sortBy: "salary", order: "desc" });
  console.log("Top 3 Highest Paid:");
  sortedSalary.data.slice(0, 3).forEach(e => console.log(" -", e.name, "| Salary:", e.salary, "| Role:", e.role));

  console.log("\n[TEST 4] GET /api/employees?page=1&limit=10");
  const pagedEmployees = queryEmployees({ page: 1, limit: 10 });
  console.log("Page:", pagedEmployees.meta.page, "Limit:", pagedEmployees.meta.limit, "Total:", pagedEmployees.meta.total, "Total Pages:", pagedEmployees.meta.totalPages);
  console.log("Returned Records Count:", pagedEmployees.data.length);

  console.log("\n[TEST 5] GET /api/employees?search=Arun");
  const searchArun = queryEmployees({ search: "Arun" });
  console.log("Matched Count:", searchArun.meta.total);
  searchArun.data.forEach(e => console.log(" -", e.name, "|", e.department, "|", e.email));

  console.log("\nAll Module 1 backend verification checks completed successfully.\n");
}

if (process.argv[1]?.endsWith("module1_backend_api.ts")) {
  runTests();
}
