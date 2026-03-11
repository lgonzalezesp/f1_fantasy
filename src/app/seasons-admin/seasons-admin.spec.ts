import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SeasonsAdmin } from "./seasons-admin";

describe("SeasonsAdmin", () => {
  let component: SeasonsAdmin;
  let fixture: ComponentFixture<SeasonsAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonsAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonsAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
