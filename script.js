// Diaporama

const AUTOPLAY_DELAY_MS = 5000;
const SWIPE_MIN_DISTANCE_PX = 50;

const slides = document.querySelectorAll(".slideshow__slide");
const dots = document.querySelectorAll(".slideshow__dot");
const slideshowFrame = document.querySelector(".slideshow__frame");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let currentSlideIndex = 0;
let autoplayTimer;

function showSlide(index) {
  // Le modulo sert à boucler : après la dernière diapo on revient à la première
  currentSlideIndex = (index + slides.length) % slides.length;

  slides.forEach((slide, i) => slide.classList.toggle("is-active", i === currentSlideIndex));
  dots.forEach((dot, i) => {
    dot.classList.toggle("is-active", i === currentSlideIndex);
    dot.setAttribute("aria-current", i === currentSlideIndex);
  });
}

function stopAutoplay() {
  clearInterval(autoplayTimer);
}

function startAutoplay() {
  stopAutoplay();
  if (!prefersReducedMotion) {
    autoplayTimer = setInterval(() => showSlide(currentSlideIndex + 1), AUTOPLAY_DELAY_MS);
  }
}

// Après un clic manuel, on relance le minuteur pour ne pas changer de diapo juste après
document.getElementById("previousSlideButton").addEventListener("click", () => {
  showSlide(currentSlideIndex - 1);
  startAutoplay();
});
document.getElementById("nextSlideButton").addEventListener("click", () => {
  showSlide(currentSlideIndex + 1);
  startAutoplay();
});
dots.forEach((dot, index) => dot.addEventListener("click", () => {
  showSlide(index);
  startAutoplay();
}));

// Le défilement automatique est en pause tant que la souris est sur le diaporama
slideshowFrame.addEventListener("mouseenter", stopAutoplay);
slideshowFrame.addEventListener("mouseleave", startAutoplay);

// Glisser au doigt sur mobile : on compare la position de départ et d'arrivée
let swipeStartX = null;
slideshowFrame.addEventListener("touchstart", event => {
  swipeStartX = event.touches[0].clientX;
  stopAutoplay();
}, { passive: true });
slideshowFrame.addEventListener("touchend", event => {
  if (swipeStartX !== null) {
    const swipeDistance = event.changedTouches[0].clientX - swipeStartX;
    if (Math.abs(swipeDistance) > SWIPE_MIN_DISTANCE_PX) {
      // Glissé vers la gauche = diapo suivante, vers la droite = diapo précédente
      showSlide(currentSlideIndex + (swipeDistance < 0 ? 1 : -1));
    }
  }
  swipeStartX = null;
  startAutoplay();
});

// Un clic sur une image mène à la section « Mes travaux »
slideshowFrame.addEventListener("click", event => {
  if (event.target.closest(".slideshow__slide img")) {
    document.getElementById("projects").scrollIntoView({ behavior: "smooth" });
  }
});

startAutoplay();


// Apparition des éléments au scroll

const REVEAL_VISIBLE_RATIO = 0.15;

const elementsToReveal = document.querySelectorAll(
  ".project-card, .footer__columns, .footer__title, .section-title, .about__text"
);
elementsToReveal.forEach(element => element.classList.add("reveal"));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target); // l'animation ne se joue qu'une fois
    }
  });
}, { threshold: REVEAL_VISIBLE_RATIO });
elementsToReveal.forEach(element => revealObserver.observe(element));


// Images des projets

// Si une image est introuvable, on la retire pour laisser voir le fond de la carte
document.querySelectorAll(".project-card img").forEach(image =>
  image.addEventListener("error", () => image.remove()));


// Formulaire de contact
// Simulation : le message n'est pas envoyé, on affiche seulement la confirmation.

const MIN_NAME_LENGTH = 2;
const MIN_MESSAGE_LENGTH = 10;

const NAME_PATTERN = /^[\p{L}\s'’-]+$/u; // lettres, espaces, apostrophes et tirets
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_ALLOWED_CHARACTERS = /^[\d\s.+()-]+$/;
const PHONE_NUMBER_PATTERN = /^(?:\+|00)?\d{9,14}$/; // appliqué après retrait des séparateurs

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const formFields = {
  lastname: document.getElementById("lastname"),
  firstname: document.getElementById("firstname"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
  message: document.getElementById("message")
};

// Le nom et le prénom ont les mêmes règles, seul le mot dans le message change
function getNameError(value, label) {
  if (!value) return `Veuillez renseigner votre ${label}.`;
  if (value.length < MIN_NAME_LENGTH) return `Le ${label} doit contenir au moins ${MIN_NAME_LENGTH} caractères.`;
  if (!NAME_PATTERN.test(value)) return `Le ${label} ne doit contenir que des lettres.`;
  return "";
}

// Chaque fonction renvoie le message d'erreur, ou "" si la valeur est valide
const fieldValidators = {
  lastname: value => getNameError(value, "nom"),
  firstname: value => getNameError(value, "prénom"),
  email(value) {
    if (!value) return "Veuillez renseigner votre adresse email.";
    if (!EMAIL_PATTERN.test(value)) return "Adresse email invalide (ex. nom@exemple.fr).";
    return "";
  },
  phone(value) {
    if (!value) return "Veuillez renseigner votre numéro de téléphone.";
    if (!PHONE_ALLOWED_CHARACTERS.test(value)) return "Le téléphone ne doit contenir que des chiffres.";
    const digitsOnly = value.replace(/[\s.()-]/g, "");
    if (!PHONE_NUMBER_PATTERN.test(digitsOnly)) return "Numéro invalide (ex. 06 12 34 56 78).";
    return "";
  },
  message(value) {
    if (!value) return "Veuillez écrire un message.";
    if (value.length < MIN_MESSAGE_LENGTH) return `Le message doit contenir au moins ${MIN_MESSAGE_LENGTH} caractères.`;
    return "";
  }
};

// Vérifie un champ, affiche son erreur et renvoie true s'il est valide
function validateField(fieldName) {
  const input = formFields[fieldName];
  const errorMessage = fieldValidators[fieldName](input.value.trim());
  document.getElementById(`${fieldName}-error`).textContent = errorMessage;
  input.setAttribute("aria-invalid", errorMessage ? "true" : "false");
  return !errorMessage;
}

// type : "success", "error", ou "" pour effacer le message
function showFormStatus(type, text) {
  formStatus.className = "contact-form__status" + (type ? ` is-${type}` : "");
  formStatus.textContent = text;
}

Object.keys(formFields).forEach(fieldName => {
  const input = formFields[fieldName];
  input.addEventListener("blur", () => validateField(fieldName));
  input.addEventListener("input", () => {
    // Une fois le champ signalé en erreur, on le revérifie à chaque frappe
    if (input.getAttribute("aria-invalid") === "true") validateField(fieldName);
    showFormStatus("", "");
  });
});

contactForm.addEventListener("submit", event => {
  event.preventDefault();

  // On valide tous les champs sans s'arrêter à la première erreur, pour les afficher toutes
  const validationResults = Object.keys(formFields).map(validateField);
  if (validationResults.includes(false)) {
    showFormStatus("error", "Le formulaire contient des erreurs. Merci de les corriger.");
    const firstInvalidField = Object.values(formFields).find(input => input.getAttribute("aria-invalid") === "true");
    if (firstInvalidField) firstInvalidField.focus();
    return;
  }

  contactForm.reset();
  Object.values(formFields).forEach(input => input.removeAttribute("aria-invalid"));
  showFormStatus("success", "Merci ! Votre message a bien été envoyé.");
});
