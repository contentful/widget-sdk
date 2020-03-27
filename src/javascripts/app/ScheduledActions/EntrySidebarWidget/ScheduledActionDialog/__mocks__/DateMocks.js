export function spyOnDateNow() {
  return jest.spyOn(Date, 'now');
}

export function mockNow(dateNowMock, now) {
  return dateNowMock.mockImplementation(jest.fn(() => new Date(now).valueOf()));
}

export function mockNowOnce(dateNowMock, now) {
  return dateNowMock.mockImplementationOnce(jest.fn(() => new Date(now).valueOf()));
}
