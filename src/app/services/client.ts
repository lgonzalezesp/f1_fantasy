import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, setDoc, addDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface ClientModel {
  id?: string;
  name: string;
  favoriteNumber: number;
  seasonId: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private firestore: Firestore;
  private clientsCollection;

  constructor(firestore: Firestore) {
    this.firestore = firestore;
    this.clientsCollection = collection(this.firestore, 'clients');
  }

  getClients(): Observable<ClientModel[]> {
    return collectionData(this.clientsCollection, { idField: 'id' }) as Observable<ClientModel[]>;
  }

  async addClient(clientData: Omit<ClientModel, 'id'>) {
    return await addDoc(this.clientsCollection, clientData);
  }

  async updateClient(clientId: string, data: Partial<ClientModel>) {
    const clientDoc = doc(this.firestore, `clients/${clientId}`);
    return await setDoc(clientDoc, data, { merge: true });
  }

  async deleteClient(clientId: string) {
    const clientDoc = doc(this.firestore, `clients/${clientId}`);
    return await deleteDoc(clientDoc);
  }
}
