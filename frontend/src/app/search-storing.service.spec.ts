import { TestBed } from '@angular/core/testing';

import { SearchStoringService } from './search-storing.service';

describe('SearchStoringService', () => {
  let service: SearchStoringService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchStoringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
