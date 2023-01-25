"use strict";

class Workout {
  clicks = 0;
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
    // console.log(this.description);
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([32.55, 64.292], 5.2, 24, 178);
// const cycle1 = new Cycling([32.55, 64.292], 27, 95, 523);
// console.log(run1, cycle1);
// ////////////////////////////////////////////////////////////////////////////

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    // event delegation
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("Could not get your position");
      }
    );
  }
  _loadMap(position) {
    const { longitude, latitude } = position.coords;
    const coords = [latitude, longitude];
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    this.#map = L.map("map").setView(coords, 13); // 13 is zoom

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      // fr/hot/
      // leaflet uses openstreetmap but we can use google map in leaflet as well
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // default basic marker
    // L.marker(coords)
    //   .addTo(map)
    //   .bindPopup("A pretty CSS3 popup.<br> Easily customizable.")
    //   .openPopup();

    // console.log(map);
    //  to add eventlistner on map, we use on method

    // without bind, this was set to #map, because that's what on addeventlistner (on) is being called
    this.#map.on("click", this._showForm.bind(this));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    // console.log(this);
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        "";
    // to avoid animation, we first immedietly hide the form
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);
  }
  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }
  _newWorkout(e) {
    const validInput = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    // get the data

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    // if running, create running object, otherwise ccyling object
    if (type === "running") {
      const cadence = +inputCadence.value;
      // check data validity
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      // check data validity
      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // add the new object to workout array
    this.#workouts.push(workout);
    // console.log(this.#workouts);
    // render workout on map as marker

    // render workout on list
    this._renderWorkout(workout);

    this._renderWorkoutMarker(workout);
    // hide form and clear input fields
    // clear input fields
    this._hideForm();
  }
  _renderWorkoutMarker(workout) {
    // const { lat, lng } = this.#mapEvent.latlng;
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}  ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon"> ${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;
    if (workout.type === "cycling") {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
      </li>
`;
    }
    if (workout.type === "running") {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>
  `;
    }
    form.insertAdjacentHTML("afterend", html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    console.log(workoutEl);
    if (!workoutEl) return;
    console.log(this);
    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
    workout.click();
  }
}

const app = new App();
