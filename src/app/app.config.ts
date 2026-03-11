import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';

const firebaseConfig = {
  apiKey: "AIzaSyBU-xOcOyHPjZPOBtMup4L_BrBzBsU7DVg",
  authDomain: "f1-fantasy-lge.firebaseapp.com",
  projectId: "f1-fantasy-lge",
  storageBucket: "f1-fantasy-lge.firebasestorage.app",
  messagingSenderId: "613084825861",
  appId: "1:613084825861:web:867b6b4ddf7fbe4fce8f6c",
  measurementId: "G-Y5GMW8PWCL"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore())
  ]
};
