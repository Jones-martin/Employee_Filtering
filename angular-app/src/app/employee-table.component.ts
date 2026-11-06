import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Employee } from "./employee.model";
import { BonusPipe, EmployeeDatePipe, SalaryPipe, TitlecaseTextPipe } from "./pipes";

@Component({
  selector: "app-employee-table",
  standalone: true,
  imports: [SalaryPipe, EmployeeDatePipe, TitlecaseTextPipe, BonusPipe],
  template: `
    <table>
      <thead>
        <tr><th>Select</th><th>ID</th><th>Name</th><th>Department</th><th>Role</th><th>Salary</th><th>Total compensation</th><th>Joining date</th></tr>
      </thead>
      <tbody>
        @for (employee of employees; track employee.id) {
          <tr [class.selected]="selectedIds.has(employee.id)">
            <td><input type="checkbox" [checked]="selectedIds.has(employee.id)" (change)="toggle(employee)"></td>
            <td>{{ employee.id }}</td>
            <td>{{ employee.name | titlecaseText }}</td>
            <td>{{ employee.department }}</td>
            <td>{{ employee.role | titlecaseText }}</td>
            <td>{{ employee.salary | salary }}</td>
            <td>{{ employee.salary | bonus:12 | salary }}</td>
            <td>{{ employee.joinDate | employeeDate }}</td>
          </tr>
        } @empty {
          <tr><td colspan="8" class="empty">No employees found.</td></tr>
        }
      </tbody>
    </table>
  `,
  styles: [`
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { padding: 14px 18px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { background: #f1f5f9; color: #475569; font-size: 12px; text-transform: uppercase; }
    tr.selected { background: #dbeafe; }
    .empty { text-align: center; color: #64748b; }
  `]
})
export class EmployeeTableComponent {
  @Input({ required: true }) employees: Employee[] = [];
  @Output() readonly selectionChange = new EventEmitter<Employee[]>();
  selectedIds = new Set<number>();

  toggle(employee: Employee): void {
    if (this.selectedIds.has(employee.id)) this.selectedIds.delete(employee.id);
    else this.selectedIds.add(employee.id);
    this.selectionChange.emit(this.employees.filter(item => this.selectedIds.has(item.id)));
  }
}
