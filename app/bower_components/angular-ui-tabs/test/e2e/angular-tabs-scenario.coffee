describe "Tab system", ->
  beforeEach ->
    browser.get ''

  it "should 1", ->
    element(By.css('header button.tab-type-volatile')).click()
    expect(true).toBe true

  it "should 2", ->
    expect(true).toBe true

