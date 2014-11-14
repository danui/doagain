(function () {
    "use strict";
    
    var SECOND = 1000;
    var MINUTE = 60 * SECOND;
    var HOUR = 60 * MINUTE;
    var DAY = 24 * HOUR;
    var WEEK = 7 * DAY;

    function now() {
        return (new Date()).getTime();
    }

    /**
     * Task Storage
     */
    function Storage() {
        var self = this;
        var db;
        
        self.addTask = function (name, period) {
            var id = db.nextId++;
            db.task[id] = {
                id: id,
                name: name,
                period: period,
                lastDone: now() - period
            };
            flush();
        };
        self.getTaskCount = function () {
            return self.getTaskIds().length;
        };
        self.getTaskIds = function () {
            return Object.keys(db.task);
        };

        self.getTask = function (id) {
            var obj = db.task[id];
            if (obj.lastDone && obj.period) {
                obj.urgency = 1.0 * (now() - obj.lastDone) / obj.period;
            } else {
                obj.urgency = 1.0;
            }
            return obj;
        };
        
        self.setTaskDone = function (id) {
            db.task[id].lastDone = now();
            flush();
        };
        
        self.deleteTask = function (id) {
            delete db.task[id];
            flush();
        };
        
        self.readyTask = function (id) {
            db.task[id].lastDone = now() - db.task[id].period;
            flush();
        };

        function flush() {
            var str = JSON.stringify(db, function (key, val) {
                if (key === '$$hashKey') {
                    return undefined;
                }
                return val;
            });
            console.log("Storing: " + str);
            localStorage.setItem('db', str);
        }
        
        function init() {
            //localStorage.removeItem('db');
            if (!('db' in localStorage)) {
                localStorage.setItem('db', JSON.stringify({
                    nextId: 0,
                    task: {}
                }));
                //console.log("created new database in localStorage");
            } else {
                //console.log("database exists");
            }
            console.log(localStorage.getItem('db'));    
            db = JSON.parse(localStorage.getItem('db'));
        }
        init();
    }

    
    
    var app = angular.module('doagain', []);
    
    app.service('storage', function () {
        return new Storage();
    });
    
    app.controller('TaskListController', ['$scope', 'storage', '$timeout', function ($scope, storage, $timeout) {
        var showingSpecial = {};
        var isAddingTask = false;
        $scope.getTaskCount = function () {
            return storage.getTaskCount();
        };
        $scope.hasTasks = function () {
            return $scope.getTaskCount() > 0;
        };
        $scope.getTasks = function () {
            return storage.getTaskIds().map(function (id) {
                return storage.getTask(id);
            });
        };
        $scope.setTaskDone = function (id) {
            storage.setTaskDone(id);
        };
        $scope.showSpecial = function (id) {
            if ($scope.showingSpecial(id)) {
                showingSpecial = {};
            } else {
                showingSpecial = {};
                showingSpecial[id] = true;
            }
        };
        $scope.showingSpecial = function (id) {
            return id in showingSpecial;
        };
        $scope.cancelDelete = function () {
            showingSpecial = {};
        };
        $scope.deleteTask = function (id) {
            storage.deleteTask(id);
            showingSpecial = {};
        };
        $scope.setTaskReady = function (id) {
            storage.readyTask(id);
            showingSpecial = {};
        };
        $scope.isAddingTask = function () {
            return isAddingTask;
        };
        $scope.startAdding = function () {
            isAddingTask = !isAddingTask;
        };
        $scope.stopAdding = function () {
            isAddingTask = false;
        };
        $scope.addTask = function () {
            if ($scope.newName === undefined ||
                $scope.newName === null ||
                typeof $scope.newName !== 'string' ||
                $scope.newName === '')
            {
                alert('bad name');
                return;
            }
            if ($scope.newPeriod === undefined ||
                $scope.newPeriod === null ||
                $scope.newPeriod <= 0.0)
            {
                alert('bad period');
                return;
            }
            storage.addTask($scope.newName, $scope.newPeriod * DAY);
            $scope.newName = '';
            $scope.newPeriod = 0;
            isAddingTask = false;
        };
        function tick() {
            $timeout(tick, 10000);
        }
        tick();
        console.log($scope.getTasks());
    }]);
}());
