function algorithm(vector, progress, end) {
    let nMsg  = vector.length.toString().length * 100;
    let count = 0;
    let result = vector.map((d, i) => {
        if (i === Math.round(vector.length / nMsg) * count) {
            progress(i / vector.length * 100);
            count++;
        }
        // Transformation
        return d;
    });
    progress(100);
    end(result);
}