import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, setDoc, addDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Year {
  id?: string;
  name: string; // e.g. "2024", "2025"
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);
  private yearsCollection = collection(this.firestore, 'years');

  // Obtener todos los años en tiempo real
  getYears(): Observable<Year[]> {
    return collectionData(this.yearsCollection, { idField: 'id' }) as Observable<Year[]>;
  }

  // Agregar un nuevo año
  async addYear(yearData: Omit<Year, 'id'>) {
    return await addDoc(this.yearsCollection, yearData);
  }

  // Actualizar un año existente
  async updateYear(yearId: string, data: Partial<Year>) {
    const yearDoc = doc(this.firestore, `years/${yearId}`);
    return await setDoc(yearDoc, data, { merge: true });
  }
}
