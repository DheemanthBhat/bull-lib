module.exports = {
  displayTime: function (limit) {
    process.stdout.write("Job will finish in   ");
    for (let i = 1; i <= limit; i++) {
      let milliseconds = i * 1000;
      setTimeout(() => {

        process.stdout.write("\b\b");
        if ((limit - i)/10 < 1) {
          process.stdout.write(" " + (limit - i));
        } else {
          process.stdout.write("" + (limit - i));
        }

        if(i == limit) {
          console.log("");
        }
      }, milliseconds);
    }
  }
}