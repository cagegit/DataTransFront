Live [Demo](http://dimapod.github.io/angular-tabs)

[ ![Codeship Status for dimapod/angular-tabs](https://codeship.com/projects/c88d0ef0-5861-0132-43f2-2264a2250d8e/status)](https://codeship.com/projects/50058)

angular-ui-tabs
===============

Angular Tabs is an AngularJS module that add real tab system to your application.

**Features**
- Management of infinite number of tabs
- Volatile tabs (removed from DOM) and DOM Persistent tabs
- Simple extensible syntax
- Multiple themes

##Getting Started
**(1)** Install via Bower.
```bash
$ bower install angular-ui-tabs --save
```

**(2)** Include `angular-tabs.js` (or `angular-tabs.min.js`) in your `index.html`, after including Angular itself.

```html
  <script src="../bower_components/angular-ui-tabs/angular-tabs.min.js"></script>
```

**(3)** Include one of CSS themes.

```html
  <link rel="stylesheet" href="../bower_components/angular/styles/blue.css">
```

**(4)** Add `'angular-tabs'` to your main module's list of dependencies.
```js
var app = angular.module('app', ['angular-tabs'])
```


You are ready to go


##Configuration

The configuration of the tab system is done using $uiTabsProvider:
```js
app.config(function ($uiTabsProvider) {
    ...
});
```

### tab

Register a new tab type to the tab-system.
 
Signature: `tab(tabType, tabOptions)` 

- `tabType` (String): Type of the type
- `tabOptions` (Hash object): Tab options
    - `title` (String): Default tab title
    - `template`(String|Function): tab template
    - `templateUrl`(String|Function): tab template url
    - `controller`(String|Function): tab controller
    - `volatile` (boolean): Defines if this tab type is volatile or DOM persistent (true by default)
    
```js
$uiTabsProvider
    .tab('tab', {
        title: 'Tab Title',
        templateUrl: 'tab.html',
        controller: 'tabCtrl',
        volatile: true
    })
```

### welcome

Register Welcome Tab to the tab-system. Welcome Tab is automatically instantiated by the system and is shown when all the tabs are closed. If no 'welcome tab' is registered in the system, the empty template will be used.
 
Signature: `welcome(tabOptions)` 

- `tabOptions` (Object): Welcome tab options

The same as for `tab()` - see above
    
```js
$uiTabsProvider
    .welcome({
        template: '<h2>Hello Tab System</h2>'
    })
```

### onClose

Injectable service, defining a function that will be called every time before user tries to close a tab. The inner function takes `tab` instance as a parameter and should return a promise. If the promise is resolved, the tab will be closed, if rejected - tab will remain in tab-system.

By default, when no `onClose` method specified, closing the tab will actually close the tab right away. 

Signature: `onClose(injectable)` 

This feature is handy for example when one would like to show confirmation dialog before actually close the tab:    

```js
$uiTabsProvider
    .onClose(['confirmDialogService', function (confirmDialogService) {
        return function (tab) {
            return confirmDialogService.openConfirmDialog(tab.pristine, 'Are you sure ?');
        };
    }]);
```

### config

Tab header items and tab header menu item templates configuration.

Signature: `config(configuration)` 

- `configuration` (Hash object): 
    - `tabHeaderItemTemplate` (String|Function): Tab header item template 
    - `tabHeaderItemTemplateUrl` (String|Function): Tab header item template url
    - `tabHeaderMenuItemTemplate` (String|Function): Tab header menu item template url
    - `tabHeaderMenuItemTemplateUrl` (String|Function): Tab header menu item template url

```js
$uiTabsProvider
    .config({
        tabHeaderItemTemplateUrl: 'tab-header-item-template.html',
        tabHeaderMenuItemTemplate: '<span>{{tab.title}}</span>'
    });
```








# Contribute
## Setup

1. Install **Grunt** and **Bower**
	`$ npm install -g gulp bower`
2. Install development dependencies
	`$ npm install`
3. Install components
	`$ bower install`
4. Install components
	`$ gulp serve`
5. Releasing
	`$ gulp tag`  0.0.1 -> 0.0.2
	`$ gulp tag --minor`  0.1.0 -> 0.2.0
	`$ gulp tag --major`  1.0.0 -> 1.0.0

## Testing

We use Karma, protractor and jshint to ensure the quality of the code.
1. `$ gulp unit` - runs unit test
2. `$ grunt e2e` - runs integration tests test


