import { Pipe, PipeTransform } from "@angular/core";
import { Employee } from "./employee.model";

@Pipe({ name: "salary", standalone: true, pure: true })
export class SalaryPipe implements PipeTransform {
  transform(value: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(value);
  }
}

@Pipe({ name: "employeeDate", standalone: true, pure: true })
export class EmployeeDatePipe implements PipeTransform {
  transform(value: string): string {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(value));
  }
}

@Pipe({ name: "titlecaseText", standalone: true, pure: true })
export class TitlecaseTextPipe implements PipeTransform {
  transform(value: string): string {
    return value.toLowerCase().replace(/\b\w/g, character => character.toUpperCase());
  }
}

@Pipe({ name: "bonus", standalone: true, pure: true })
export class BonusPipe implements PipeTransform {
  transform(value: number, percentage = 12): number {
    return value + (value * percentage) / 100;
  }
}

@Pipe({ name: "employeeFilter", standalone: true, pure: false })
export class ImpureEmployeeFilterPipe implements PipeTransform {
  transform(employees: Employee[], search = ""): Employee[] {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(employee =>
      [employee.name, employee.department, employee.role, employee.email]
        .some(value => value.toLowerCase().includes(query))
    );
  }
}
