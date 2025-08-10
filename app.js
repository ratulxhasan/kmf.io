<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDOpfGcOaV6SE3Z6hGrB8k_BNKcII6Psyg",
    authDomain: "kmfworkers.firebaseapp.com",
    projectId: "kmfworkers",
    storageBucket: "kmfworkers.firebasestorage.app",
    messagingSenderId: "345856300895",
    appId: "1:345856300895:web:c0b07b90b45f86989b88ea",
    measurementId: "G-M35E3DJD9V"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
