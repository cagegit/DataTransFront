describe "Tab Utils", ->
  beforeEach module "angular-tabs-utils"

  beforeEach ->
    inject (_utils_) ->
      @utils = _utils_

  describe "remove method", ->
    it "should return empty array given undefined array", ->
      array = undefined
      removed = @utils.remove(array)
      expect(removed).toEqual([])
      expect(array).toEqual(undefined)

    it "should return empty array given empty array", ->
      array = []
      removed = @utils.remove(array)
      expect(removed).toEqual([])
      expect(array).toEqual([])

    it "should not remove any element when no callback given", ->
      array = [1, 2, 3]
      removed = @utils.remove(array)
      expect(removed).toEqual []
      expect(array).toEqual [1, 2, 3]

    it "should not remove any element given callback that do not match any element", ->
      array = [1, 2, 3]
      removed = @utils.remove(array, () -> false)
      expect(removed).toEqual []
      expect(array).toEqual [1, 2, 3]

    it "should remove one element given callback that match one element", ->
      array = [1, 2, 3]
      removed = @utils.remove(array, (val) -> val == 1)
      expect(removed).toEqual [1]
      expect(array).toEqual [2, 3]

    it "should remove all matched elements given callback that match many elements", ->
      array = [1, 2, 3]
      removed = @utils.remove(array, (val) -> val > 1)
      expect(removed).toEqual [2, 3]
      expect(array).toEqual [1]



  # debounce