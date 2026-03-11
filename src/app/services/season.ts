import { Injectable, inject } from "@angular/core";
import { Firestore, collection, collectionData, doc, setDoc, addDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface SeasonModel {
  id?: string;
  name: string; // e.g. "Temporada 2026"
  isActive: boolean;
}

@Injectable({
  providedIn: "root",
})
export class Season {
  private firestore: Firestore;
  private seasonsCollection;

  constructor(firestore: Firestore) {
    this.firestore = firestore;
    this.seasonsCollection = collection(this.firestore, 'seasons');
  }

  getSeasons(): Observable<SeasonModel[]> {
    return collectionData(this.seasonsCollection, { idField: 'id' }) as Observable<SeasonModel[]>;
  }

  async addSeason(seasonData: Omit<SeasonModel, 'id'>) {
    return await addDoc(this.seasonsCollection, seasonData);
  }

  async updateSeason(seasonId: string, data: Partial<SeasonModel>) {
    const seasonDoc = doc(this.firestore, `seasons/${seasonId}`);
    return await setDoc(seasonDoc, data, { merge: true });
  }

  async deleteSeason(seasonId: string) {
    const seasonDoc = doc(this.firestore, `seasons/${seasonId}`);
    return await deleteDoc(seasonDoc);
  }
}
