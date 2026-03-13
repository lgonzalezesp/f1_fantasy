import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface DriverModel {
  id: string;
  name: string;
  teamId: string;
  seasonId: string;
}

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private firestore = inject(Firestore);
  private collectionName = 'drivers';

  getDrivers(): Observable<DriverModel[]> {
    const driversRef = collection(this.firestore, this.collectionName);
    return collectionData(driversRef, { idField: 'id' }) as Observable<DriverModel[]>;
  }

  getDriversBySeason(seasonId: string): Observable<DriverModel[]> {
    const driversRef = collection(this.firestore, this.collectionName);
    const q = query(driversRef, where('seasonId', '==', seasonId));
    return collectionData(q, { idField: 'id' }) as Observable<DriverModel[]>;
  }

  async addDriver(driver: Omit<DriverModel, 'id'>) {
    const driversRef = collection(this.firestore, this.collectionName);
    return addDoc(driversRef, driver);
  }

  async updateDriver(id: string, driver: Partial<DriverModel>) {
    const driverDoc = doc(this.firestore, `${this.collectionName}/${id}`);
    return updateDoc(driverDoc, driver);
  }

  async deleteDriver(id: string) {
    const driverDoc = doc(this.firestore, `${this.collectionName}/${id}`);
    return deleteDoc(driverDoc);
  }
}
