import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskDto } from '../tasks/tasks.service';
import { ActivityDto } from '../activities/activities.service';

export interface MetricsDto {
  openDealCount: number;
  totalPipelineValue: number;
  todayTaskCount: number;
  newContactCount: number;
}

export interface StageCountDto {
  stage: string;
  count: number;
  totalValue: number;
}

export interface DashboardSummaryDto {
  metrics: MetricsDto;
  pipelineSummary: StageCountDto[];
  myTasks: TaskDto[];
  recentActivities: ActivityDto[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<DashboardSummaryDto> {
    return this.http.get<DashboardSummaryDto>('/api/dashboard/summary');
  }
}
