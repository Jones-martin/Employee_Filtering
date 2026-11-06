import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Employee, EmployeeResponse } from "./employee.model";
import { EmployeeService } from "./employee.service";
import { EmployeeTableComponent } from "./employee-table.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeTableComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css"
})
export class AppComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  response?: EmployeeResponse;
  selectedEmployees: Employee[] = [];
  loading = false;
  error = "";
  search = "";
  department = "ALL";
  sortBy = "salary";
  order: "asc" | "desc" = "desc";
  page = 1;
  limit = 10;
  minSalary?: number;
  maxSalary?: number;

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;
    this.error = "";
    this.employeeService.getEmployees({
      search: this.search,
      department: this.department,
      sortBy: this.sortBy,
      order: this.order,
      page: this.page,
      limit: this.limit,
      minSalary: this.minSalary,
      maxSalary: this.maxSalary
    }).subscribe({
      next: response => {
        this.response = response;
        this.loading = false;
      },
      error: () => {
        this.error = "Unable to load employees. Check that the Node.js API is running.";
        this.loading = false;
      }
    });
  }

  reset(): void {
    this.search = "";
    this.department = "ALL";
    this.sortBy = "salary";
    this.order = "desc";
    this.page = 1;
    this.minSalary = undefined;
    this.maxSalary = undefined;
    this.loadEmployees();
  }

  changePage(delta: number): void {
    const totalPages = this.response?.meta.totalPages ?? 1;
    this.page = Math.min(Math.max(1, this.page + delta), totalPages);
    this.loadEmployees();
  }

  selectEmployees(employees: Employee[]): void {
    this.selectedEmployees = employees;
  }
}
