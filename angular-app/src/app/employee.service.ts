import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { EmployeeResponse } from "./employee.model";

@Injectable({ providedIn: "root" })
export class EmployeeService {
  private readonly http = inject(HttpClient);

  getEmployees(filters: {
    search: string;
    department: string;
    sortBy: string;
    order: "asc" | "desc";
    page: number;
    limit: number;



    minSalary?: number;
    maxSalary?: number;
  }): Observable<EmployeeResponse> {
    let params = new HttpParams()
      .set("page", filters.page)
      .set("limit", filters.limit)
      .set("sortBy", filters.sortBy)
      .set("order", filters.order);

    if (filters.search) params = params.set("search", filters.search);
    if (filters.department !== "ALL") params = params.set("department", filters.department);
    if (filters.minSalary !== undefined) params = params.set("minSalary", filters.minSalary);
    if (filters.maxSalary !== undefined) params = params.set("maxSalary", filters.maxSalary);
    return this.http.get<EmployeeResponse>("/api/employees", { params });
  }
}
