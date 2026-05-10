/**
 * BookingService.cancelBooking — TDD-strict.
 * src/backend/booking/ is on the testing-strategy.md TDD-strict watchlist
 * (state machine + refund rules).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingService } from './booking.service';
import { BookingEntity, type BookingStatus } from '../domain/entities/booking.entity';

const HOUR = 60 * 60 * 1000;
const NOW = new Date('2024-01-15T10:00:00Z');

function makeBooking(overrides: {
  status?: BookingStatus;
  startOffsetMs?: number;
} = {}): BookingEntity {
  const start = new Date(NOW.getTime() + (overrides.startOffsetMs ?? 7 * 24 * HOUR));
  const end = new Date(start.getTime() + HOUR);
  return new BookingEntity({
    id: 'b_42',
    assetId: 'asset_coaching',
    creatorUid: 'creator_1',
    patientUid: 'patient_1',
    patientName: 'Ana',
    patientEmail: 'ana@example.com',
    startTime: start,
    endTime: end,
    status: overrides.status ?? 'scheduled',
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe('BookingService.cancelBooking', () => {
  let mockRepo: { getById: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let service: BookingService;

  beforeEach(() => {
    mockRepo = {
      getById: vi.fn(),
      save: vi.fn(async () => {}),
    };
    service = new BookingService(mockRepo as any);
  });

  it('throws "Booking not found" when the id does not exist', async () => {
    mockRepo.getById.mockResolvedValueOnce(null);
    await expect(service.cancelBooking('does_not_exist', NOW))
      .rejects.toThrow(/Booking not found/i);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('reads the booking by id from the repo', async () => {
    mockRepo.getById.mockResolvedValueOnce(makeBooking());
    await service.cancelBooking('b_42', NOW);
    expect(mockRepo.getById).toHaveBeenCalledWith('b_42');
  });

  it('returns the booking with status=cancelled and refundEligible=true when >24h to startTime (scheduled)', async () => {
    const booking = makeBooking({ status: 'scheduled', startOffsetMs: 25 * HOUR });
    mockRepo.getById.mockResolvedValueOnce(booking);
    const result = await service.cancelBooking('b_42', NOW);
    expect(result.status).toBe('cancelled');
    expect(result.refundEligible).toBe(true);
  });

  it('returns refundEligible=false when ≤24h to startTime (scheduled)', async () => {
    const booking = makeBooking({ status: 'scheduled', startOffsetMs: 23 * HOUR });
    mockRepo.getById.mockResolvedValueOnce(booking);
    const result = await service.cancelBooking('b_42', NOW);
    expect(result.status).toBe('cancelled');
    expect(result.refundEligible).toBe(false);
  });

  it('returns refundEligible=null when cancelling from pending_payment (no money charged)', async () => {
    const booking = makeBooking({ status: 'pending_payment', startOffsetMs: 7 * 24 * HOUR });
    mockRepo.getById.mockResolvedValueOnce(booking);
    const result = await service.cancelBooking('b_42', NOW);
    expect(result.status).toBe('cancelled');
    expect(result.refundEligible).toBeNull();
  });

  it('persists the updated booking via repo.save BEFORE returning', async () => {
    const booking = makeBooking({ status: 'scheduled', startOffsetMs: 48 * HOUR });
    mockRepo.getById.mockResolvedValueOnce(booking);
    await service.cancelBooking('b_42', NOW);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(booking); // same instance, mutated in place
  });

  it.each<BookingStatus>(['completed', 'cancelled', 'no_show'])(
    'propagates the entity guard when current status is %s (illegal transition)',
    async (status) => {
      mockRepo.getById.mockResolvedValueOnce(makeBooking({ status }));
      await expect(service.cancelBooking('b_42', NOW))
        .rejects.toThrow(/illegal transition/i);
      expect(mockRepo.save).not.toHaveBeenCalled();
    }
  );
});
