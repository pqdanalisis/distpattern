function kmeans3( vector,progress, end){
    let nMsg  = vector.length.toString().length * 100;
    let count = 0;
    var Clusters=3;
    var Groups = [];
    var Centroids = [];
    var oldCentroids = [];
    var changed = false;
    var class_array = [];

        // pick initial centroids
        var initialCentroids = Math.round(vector.length / (Clusters + 1));
        for (var i = 0; i < Clusters; i++) {
            Centroids[i] = vector[(initialCentroids * (i + 1))];
        }
        do {
            for (var j = 0; j < Clusters; j++) {
                Groups[j] = [];
            }
            changed = false;
            var newGroup;
            for (i = 0; i < vector.length; i++) {
                var oldDistance = -1;
                var distance;
                for (j = 0; j < Clusters; j++) {
                    distance = Math.abs(Centroids[j] - vector[i]);
                    if (oldDistance == -1) {
                        oldDistance = distance;
                        newGroup = j;
                    }
                    else if (distance <= oldDistance) {
                        newGroup = j;
                        oldDistance = distance;
                    }
                }
                Groups[newGroup].push(vector[i]);
            }
            oldCentroids = Centroids;
            var total = 0, newCentroid = 0;
            for (j = 0; j < Clusters; j++) {
                total = 0;
                newCentroid = 0;
                for (i = 0; i < Groups[j].length; i++) {
                    total += Groups[j][i];
                }
                newCentroid = total / Groups[newGroup].length;
                Centroids[j] = newCentroid;
            }
            for (j = 0; j < Clusters; j++) {
                if (Centroids[j] != oldCentroids[j]) {
                    changed = true;
                }
            }
        }
        while (changed === true);

//  return Groups;
        function Comparator(a, b) {
            if (a[1] < b[1]) return -1;
            if (a[1] > b[1]) return 1;
            return 0;
        }

        Groups = Groups.sort(Comparator);
        function include(list, atom) {
            if (list.length === 0) {
                return false;
            }
            else {
                if (list[0] === atom) {
                    return true;
                } else {
                    return include(list.slice(1), atom);
                }
            }
        }


        for (i = 0; i < vector.length; i++) {
            if (i === Math.round(vector.length / nMsg) * count) {
                progress(i / vector.length * 100);
                count++;
            }
            for (j = 0; j < Groups.length; j++) {
                if (include(Groups[j], vector[i])) {
                    class_array.push(j);
                    break;
                }
            }
        }
    progress(100);
    end(class_array);
}


