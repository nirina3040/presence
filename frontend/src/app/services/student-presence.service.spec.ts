import { TestBed } from '@angular/core/testing';

import { StudentPresenceService } from './student-presence.service';

describe('StudentPresenceService', () => {
  let service: StudentPresenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudentPresenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
