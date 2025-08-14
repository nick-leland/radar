function delay_time(importance) {
    const levels = {
        "0": 10,
        "1": 100,
        "2": 300,
        "3": 600,
    }
    const level = levels[importance];
    return Math.floor(Math.random() * level);
}

module.exports = function Logging(mod) {
    mod.log("Waiting for Character Selection");
    mod.hook('S_LOAD_TOPO', 3, event => {
        mod.log(`Switching to zone ${event.zone}!`);
    });
}