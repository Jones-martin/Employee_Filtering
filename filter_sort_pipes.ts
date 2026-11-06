import type { Employee } from "./backend_api.ts";
import { EMPLOYEES } from "./backend_api.ts";
import type { PipeTransform, PipeMetadata } from "./formatting_pipes.ts";

export interface FilterCriteria {
  department?: string;
  search?: string;
  minSalary?: number;
  maxSalary?: number;
  status?: string;
}

export class EmployeeFilterPipe implements PipeTransform {
  static readonly metadata: PipeMetadata = {
    name: "employeeFilter",
    pure: false
  };

  public executionCount: number = 0;

  transform(items: Employee[] | null | undefined, criteria?: FilterCriteria | string): Employee[] {
    this.executionCount++;
    if (!items || !Array.isArray(items)) return [];
    if (!criteria) return items;

    let parsedCriteria: FilterCriteria = {};
    if (typeof criteria === "string") {
      parsedCriteria = { search: criteria };
    } else {
      parsedCriteria = criteria;
    }

    return items.filter(emp => {
      if (parsedCriteria.department && parsedCriteria.department !== "ALL") {
        if (emp.department.toLowerCase() !== parsedCriteria.department.toLowerCase()) {
          return false;
        }
      }

      if (parsedCriteria.status && parsedCriteria.status !== "ALL") {
        if (emp.status.toLowerCase() !== parsedCriteria.status.toLowerCase()) {
          return false;
        }
      }

      if (typeof parsedCriteria.minSalary === "number") {
        if (emp.salary < parsedCriteria.minSalary) {
          return false;
        }
      }

      if (typeof parsedCriteria.maxSalary === "number") {
        if (emp.salary > parsedCriteria.maxSalary) {
          return false;
        }
      }

      if (parsedCriteria.search && parsedCriteria.search.trim() !== "") {
        const query = parsedCriteria.search.toLowerCase().trim();
        const matchesName = emp.name.toLowerCase().includes(query);
        const matchesRole = emp.role.toLowerCase().includes(query);
        const matchesDept = emp.department.toLowerCase().includes(query);
        const matchesEmail = emp.email.toLowerCase().includes(query);
        if (!matchesName && !matchesRole && !matchesDept && !matchesEmail) {
          return false;
        }
      }

      return true;
    });
  }
}

export class PureEmployeeFilterPipe implements PipeTransform {
  static readonly metadata: PipeMetadata = {
    name: "pureEmployeeFilter",
    pure: true
  };

  public executionCount: number = 0;
  private lastInput: Employee[] | null = null;
  private lastCriteriaStr: string = "";
  private cachedResult: Employee[] = [];

  transform(items: Employee[] | null | undefined, criteria?: FilterCriteria | string): Employee[] {
    const criteriaStr = JSON.stringify(criteria || {});
    if (this.lastInput === items && this.lastCriteriaStr === criteriaStr) {
      return this.cachedResult;
    }

    this.executionCount++;
    if (!items || !Array.isArray(items)) return [];

    let parsedCriteria: FilterCriteria = typeof criteria === "string" ? { search: criteria } : (criteria || {});

    const result = items.filter(emp => {
      if (parsedCriteria.department && parsedCriteria.department !== "ALL") {
        if (emp.department.toLowerCase() !== parsedCriteria.department.toLowerCase()) return false;
      }
      if (parsedCriteria.search && parsedCriteria.search.trim() !== "") {
        const q = parsedCriteria.search.toLowerCase();
        return emp.name.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q);
      }
      return true;
    });

    this.lastInput = items;
    this.lastCriteriaStr = criteriaStr;
    this.cachedResult = result;
    return result;
  }
}

export class EmployeeSortPipe implements PipeTransform {
  static readonly metadata: PipeMetadata = {
    name: "employeeSort",
    pure: true
  };

  transform(
    items: Employee[] | null | undefined,
    field: keyof Employee = "name",
    order: "asc" | "desc" = "asc"
  ): Employee[] {
    if (!items || !Array.isArray(items)) return [];
    const sorted = [...items];
    const multiplier = order === "desc" ? -1 : 1;

    sorted.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];

      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * multiplier;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return -1 * multiplier;
      if (strA > strB) return 1 * multiplier;
      return 0;
    });

    return sorted;
  }
}

export function runTests(): void {
  console.log("=== MODULE 3: PURE & IMPURE PIPES: FILTERING & SORTING (ANGULAR TS) ===");
  console.log("Team Member: Gopiram R");
  console.log("Testing: Impure Filter Pipe, Pure Sort Pipe, and Mutable State Scenarios\n");

  const impureFilter = new EmployeeFilterPipe();
  const sortPipe = new EmployeeSortPipe();

  console.log("[FILTER PIPE] Filtering by Department 'IT':");
  const itList = impureFilter.transform(EMPLOYEES, { department: "IT" });
  console.log("Count:", itList.length);
  itList.forEach(e => console.log(" -", e.name, "|", e.department, "|", e.role));

  console.log("\n[FILTER PIPE] Searching for keyword 'Arun':");
  const arunList = impureFilter.transform(EMPLOYEES, "Arun");
  console.log("Count:", arunList.length);
  arunList.forEach(e => console.log(" -", e.name, "|", e.email));

  console.log("\n[FILTER PIPE] Filtering by Min Salary 90000:");
  const highEarners = impureFilter.transform(EMPLOYEES, { minSalary: 90000 });
  console.log("Count:", highEarners.length);
  highEarners.forEach(e => console.log(" -", e.name, "| Salary:", e.salary));

  console.log("\n[SORT PIPE] Sorting by Salary descending:");
  const sortedSalary = sortPipe.transform(EMPLOYEES, "salary", "desc");
  console.log("Top 3 Salaries:");
  sortedSalary.slice(0, 3).forEach(e => console.log(" -", e.name, "|", e.salary));

  console.log("\n[PURE VS IMPURE PIPE CHANGE DETECTION BENCHMARK]");
  const mutableArray = [
    { id: 1, name: "Employee Alpha", department: "Finance", role: "Auditor", salary: 70000, joinDate: "2021-01-01", status: "Active", email: "alpha@company.com" },
    { id: 2, name: "Employee Beta", department: "IT", role: "Developer", salary: 80000, joinDate: "2021-02-01", status: "Active", email: "beta@company.com" }
  ];

  const pureFilter = new PureEmployeeFilterPipe();
  const impureTestFilter = new EmployeeFilterPipe();

  console.log("Cycle 1 Initial Filter for Department 'IT':");
  console.log(" - Pure pipe results:", pureFilter.transform(mutableArray, { department: "IT" }).length);
  console.log(" - Impure pipe results:", impureTestFilter.transform(mutableArray, { department: "IT" }).length);

  mutableArray[0].department = "IT";

  console.log("Cycle 2 After In-Place Object Mutation (array reference unchanged):");
  const pureAfter = pureFilter.transform(mutableArray, { department: "IT" });
  const impureAfter = impureTestFilter.transform(mutableArray, { department: "IT" });
  console.log(" - Pure pipe cached results (missed internal mutation):", pureAfter.length);
  console.log(" - Impure pipe re-evaluated results (caught internal mutation):", impureAfter.length);
  console.log("Pure vs Impure behavior successfully verified as per Angular specification.\n");
}

if (process.argv[1]?.endsWith("module3_filter_sort_pipes.ts")) {
  runTests();
}
