describe "Angular Tabs", ->
  welcomeTpl = 'Welcome from test'
  typeVolatile = 'typeVolatile'
  typeVolatileWithTemplateUrl = 'typeVolatileWithTemplateUrl'
  typeDomPersistent = 'typeDomPersistent'

  beforeEach ->
    angular.module("angular-tabs-test", [])
      .config ($uiTabsProvider) ->
        $uiTabsProvider
          .welcome {template: welcomeTpl}
          .tab typeVolatile,                 { template: 'Volatile tab template', title: 'Volatile tab title' }
          .tab typeVolatileWithTemplateUrl,  { templateUrl: '/volatile-template.html', title: 'Volatile tab title' }
          .tab typeDomPersistent,            { template: 'Dom Persistent tab template', title: 'Dom Persistent tab title', volatile: false }

    module "angular-tabs", "angular-tabs-test"

  beforeEach ->
    inject (_$rootScope_, _$httpBackend_, _$uiTabs_) ->
      @$rootScope = _$rootScope_
      @$httpBackend = _$httpBackend_
      @$uiTabs = _$uiTabs_

  beforeEach ->
    @$rootScope.$apply()
    @welcomeTab = @$uiTabs.getActiveTab()

  describe "getTabs method", ->
    it "should return no tabs", ->
      tabs = @$uiTabs.getTabs()
      expect(tabs).not.toBe(undefined)
      expect(tabs.length).toBe(0)

  describe "getActive tab", ->
    it "should has welcome tab as active", ->
      expect(@welcomeTab).not.toBe(undefined)
      expect(@welcomeTab.template).toBe(welcomeTpl)
      expect(@welcomeTab.$$tabId).not.toBe(undefined)
      expect(@welcomeTab.$selected).toBe(true)

  describe "addTab method", ->
    it "should deselect welcome tab when add a new tab", ->
      @$uiTabs.addTab(typeVolatile)
      @$rootScope.$apply()

      expect(@welcomeTab.$selected).toBe(false)

    it "should add new volatile tab with default options", ->
      @$uiTabs.addTab(typeVolatile)
      @$rootScope.$apply()

      tabs = @$uiTabs.getTabs()
      expect(tabs).not.toBe(undefined)
      expect(tabs.length).toBe(1)

      tab = @$uiTabs.getActiveTab()
      expect(tab).not.toBe(undefined)
      expect(tab.template).toBe('Volatile tab template')
      expect(tab.title).toBe('Volatile tab title')
      expect(tab.$selected).toBe(true)
      expect(tab.$volatile).toBe(true)

    it "should add new volatile tab with custom options", ->
      @$uiTabs.addTab(typeVolatile, {template: 'Custom volatile tab template', title: 'Custom volatile tab title'})
      @$rootScope.$apply()

      tab = @$uiTabs.getActiveTab()
      expect(tab).not.toBe(undefined)
      expect(tab.template).toBe('Custom volatile tab template')
      expect(tab.title).toBe('Custom volatile tab title')
      expect(tab.$selected).toBe(true)
      expect(tab.$volatile).toBe(true)

    it "should add dom persistent tab", ->
      @$uiTabs.addTab(typeDomPersistent)
      @$rootScope.$apply()

      tabs = @$uiTabs.getTabs()
      expect(tabs).not.toBe(undefined)
      expect(tabs.length).toBe(1)

      tab = @$uiTabs.getActiveTab()
      expect(tab).not.toBe(undefined)
      expect(tab.template).toBe('Dom Persistent tab template')
      expect(tab.title).toBe('Dom Persistent tab title')
      expect(tab.$selected).toBe(true)
      expect(tab.$volatile).toBe(false)

    it "should add dom persistent tab with custom options", ->
      @$uiTabs.addTab(typeDomPersistent, {template: 'Custom dom persistent tab template', title: 'Custom dom persistent tab title'})
      @$rootScope.$apply()

      tab = @$uiTabs.getActiveTab()
      expect(tab).not.toBe(undefined)
      expect(tab.template).toBe('Custom dom persistent tab template')
      expect(tab.title).toBe('Custom dom persistent tab title')
      expect(tab.$selected).toBe(true)
      expect(tab.$volatile).toBe(false)

    it "should volatile and add dom persistent tab", ->
      @$uiTabs.addTab(typeVolatile)
      @$uiTabs.addTab(typeDomPersistent)
      @$rootScope.$apply()

      tabs = @$uiTabs.getTabs()
      expect(tabs).not.toBe(undefined)
      expect(tabs.length).toBe(2)

    describe "with templateUrl", ->
      beforeEach ->
        @$httpBackend.whenGET '/volatile-template.html'
                     .respond 'Loaded HTML volatile content'
        @$httpBackend.whenGET '/volatile-template-option.html'
                     .respond 'Loaded HTML volatile content from options'

      it "should load template from tab definition", ->
        @$uiTabs.addTab(typeVolatileWithTemplateUrl)
        @$httpBackend.flush()
        @$rootScope.$apply()

        tab = @$uiTabs.getActiveTab()
        expect(tab.templateUrl).toBe '/volatile-template.html'
        expect(tab.template).toBeUndefined
        expect(tab.locals).not.toBe(undefined)
        expect(tab.locals.$template).toBe('Loaded HTML volatile content')

      it "should overwrite definition template by options templateUrl", ->
        @$uiTabs.addTab(typeVolatile, {templateUrl: '/volatile-template-option.html'})
        @$httpBackend.flush()
        @$rootScope.$apply()

        tab = @$uiTabs.getActiveTab()
        expect(tab.templateUrl).toBe '/volatile-template-option.html'
        expect(tab.template).toBeUndefined
        expect(tab.locals).not.toBe(undefined)
        expect(tab.locals.$template).toBe('Loaded HTML volatile content from options')

      it "should overwrite definition templateUrl by options templateUrl", ->
        @$uiTabs.addTab(typeVolatileWithTemplateUrl, {templateUrl: '/volatile-template-option.html'})
        @$httpBackend.flush()
        @$rootScope.$apply()

        tab = @$uiTabs.getActiveTab()
        expect(tab.templateUrl).toBe '/volatile-template-option.html'
        expect(tab.template).toBeUndefined
        expect(tab.locals).not.toBe(undefined)
        expect(tab.locals.$template).toBe('Loaded HTML volatile content from options')




