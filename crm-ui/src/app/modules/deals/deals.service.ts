import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type DealStage = 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';

export const STAGE_ORDER: DealStage[] = [
  'LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'
];

export const STAGE_LABELS: Record<DealStage, string> = {
  LEAD: 'Lead',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};

export interface DealDto {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  expectedCloseDate: string | null;
  contactId: string | null;
  contactName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealBoardDto {
  stages: Record<DealStage, DealDto[]>;
}

export interface CreateDealRequest {
  title: string;
  stage: DealStage;
  value?: number;
  expectedCloseDate?: string;
  contactId?: string;
  ownerId?: string;
  notes?: string;
}

export type UpdateDealRequest = CreateDealRequest;

@Injectable({ providedIn: 'root' })
export class DealsService {
  private readonly http = inject(HttpClient);

  getBoard(): Observable<DealBoardDto> {
    return this.http.get<DealBoardDto>('/api/deals/board');
  }

  getDeal(id: string): Observable<DealDto> {
    return this.http.get<DealDto>(`/api/deals/${id}`);
  }

  createDeal(body: CreateDealRequest): Observable<DealDto> {
    return this.http.post<DealDto>('/api/deals', body);
  }

  updateDeal(id: string, body: UpdateDealRequest): Observable<DealDto> {
    return this.http.put<DealDto>(`/api/deals/${id}`, body);
  }

  moveDealStage(id: string, stage: DealStage): Observable<DealDto> {
    return this.http.patch<DealDto>(`/api/deals/${id}/stage`, { stage });
  }

  deleteDeal(id: string): Observable<void> {
    return this.http.delete<void>(`/api/deals/${id}`);
  }

  getDealsByContact(contactId: string): Observable<DealDto[]> {
    return this.http.get<DealDto[]>(`/api/deals/by-contact/${contactId}`);
  }
}
