import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CdkDropListGroup, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DealsService, DealDto, DealStage, STAGE_ORDER } from '../deals.service';
import { DealColumnComponent } from '../deal-column/deal-column.component';
import { DealDrawerComponent } from '../deal-drawer/deal-drawer.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

type BoardState = Record<DealStage, DealDto[]>;

@Component({
  selector: 'app-deal-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropListGroup, DealColumnComponent, DealDrawerComponent, ButtonComponent],
  template: `
    <div class="deal-board-page">
      <div class="deal-board-page__header">
        <h1 class="deal-board-page__title">Deals</h1>
        <app-button (click)="openNewDeal()">New Deal</app-button>
      </div>

      @if (loading()) {
        <div class="deal-board-page__loading">Loading board…</div>
      } @else if (error()) {
        <div class="deal-board-page__error">
          Failed to load deals. <button class="link-btn" (click)="loadBoard()">Retry</button>
        </div>
      } @else {
        <div class="deal-board" cdkDropListGroup>
          @for (stage of stageOrder; track stage) {
            <app-deal-column
              [stage]="stage"
              [deals]="stageDeals(stage)"
              [connectedTo]="allColumnIds"
              (dropped)="onDrop($event, stage)"
              (cardClick)="openEditDeal($event)"
            />
          }
        </div>
      }
    </div>

    <app-deal-drawer
      [open]="drawerOpen()"
      [editDeal]="editingDeal()"
      [defaultStage]="defaultStage()"
      (close)="closeDrawer()"
      (saved)="loadBoard()"
    />
  `,
  styles: [`
    .deal-board-page { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .deal-board-page__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-border); flex-shrink: 0; }
    .deal-board-page__title { font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0; }
    .deal-board-page__loading, .deal-board-page__error { padding: var(--space-8); text-align: center; color: var(--color-text-secondary); }
    .deal-board { display: flex; gap: var(--space-4); padding: var(--space-5) var(--space-6); overflow-x: auto; flex: 1; align-items: flex-start; }
    .link-btn { background: none; border: none; color: var(--color-primary); cursor: pointer; text-decoration: underline; padding: 0; font-size: inherit; }
  `]
})
export class DealBoardComponent implements OnInit {
  private readonly dealsService = inject(DealsService);
  private readonly toast = inject(ToastService);

  readonly stageOrder = STAGE_ORDER;

  readonly boardState = signal<BoardState | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly drawerOpen = signal(false);
  readonly editingDeal = signal<DealDto | null>(null);
  readonly defaultStage = signal<DealStage>('LEAD');

  readonly allColumnIds = STAGE_ORDER.map(s => 'col-' + s);

  stageDeals(stage: DealStage): DealDto[] {
    return this.boardState()?.[stage] ?? [];
  }

  ngOnInit(): void {
    this.loadBoard();
  }

  loadBoard(): void {
    this.loading.set(true);
    this.error.set(false);
    this.dealsService.getBoard().subscribe({
      next: dto => {
        const state: BoardState = {} as BoardState;
        for (const stage of STAGE_ORDER) {
          state[stage] = dto.stages[stage] ?? [];
        }
        this.boardState.set(state);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  openNewDeal(stage: DealStage = 'LEAD'): void {
    this.editingDeal.set(null);
    this.defaultStage.set(stage);
    this.drawerOpen.set(true);
  }

  openEditDeal(deal: DealDto): void {
    this.editingDeal.set(deal);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingDeal.set(null);
  }

  onDrop(event: CdkDragDrop<DealDto[]>, targetStage: DealStage): void {
    const sourceStage = event.previousContainer.data[event.previousIndex]?.stage as DealStage;
    if (!sourceStage || sourceStage === targetStage && event.previousIndex === event.currentIndex) return;

    const snapshot = structuredClone(this.boardState()!);
    const deal = event.previousContainer.data[event.previousIndex];

    this.boardState.update(state => {
      if (!state) return state;
      const next: BoardState = { ...state };
      const srcList = [...next[sourceStage]];
      const dstList = sourceStage === targetStage ? srcList : [...next[targetStage]];

      if (sourceStage === targetStage) {
        moveItemInArray(srcList, event.previousIndex, event.currentIndex);
        next[sourceStage] = srcList;
      } else {
        const movedDeal = { ...deal, stage: targetStage };
        srcList.splice(event.previousIndex, 1);
        dstList.splice(event.currentIndex, 0, movedDeal);
        next[sourceStage] = srcList;
        next[targetStage] = dstList;
      }
      return next;
    });

    if (sourceStage !== targetStage) {
      this.dealsService.moveDealStage(deal.id, targetStage).pipe(
        catchError(() => {
          this.boardState.set(snapshot);
          this.toast.error('Failed to move deal. Changes reverted.');
          return EMPTY;
        })
      ).subscribe();
    }
  }
}
