function algorithm(vector, progress, end) {
    let nMsg  = vector.length.toString().length * 100;
    let count = 0;
    let sum = 0;
    for (let i = 0; i < vector.length; i++) {
        if (i === Math.round(vector.length / nMsg) * count) {
            progress(i / vector.length * 100);
            count++;
        }
        // Transformation
        sum += vector[i];
    }
    progress(100);
    end([sum / vector.length]);
}
