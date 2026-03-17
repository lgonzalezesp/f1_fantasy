import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RaceModel {
  id: string;
  name: string;
  circuit: string;
  date: string;
  seasonId: string;
  round: number;
}

@Injectable({
  providedIn: 'root'
})
export class RaceService {
  private firestore = inject(Firestore);
  private collectionName = 'races';

  getRaces(): Observable<RaceModel[]> {
    const racesRef = collection(this.firestore, this.collectionName);
    return collectionData(racesRef, { idField: 'id' }) as Observable<RaceModel[]>;
  }

  getRacesBySeason(seasonId: string): Observable<RaceModel[]> {
    const racesRef = collection(this.firestore, this.collectionName);
    const q = query(racesRef, where('seasonId', '==', seasonId));
    return (collectionData(q, { idField: 'id' }) as Observable<RaceModel[]>).pipe(
        map(races => races.sort((a, b) => a.round - b.round))
    );
  }

  async addRace(race: Omit<RaceModel, 'id'>) {
    const racesRef = collection(this.firestore, this.collectionName);
    return addDoc(racesRef, race);
  }

  async updateRace(id: string, race: Partial<RaceModel>) {
    const raceDoc = doc(this.firestore, `${this.collectionName}/${id}`);
    return updateDoc(raceDoc, race);
  }

  async deleteRace(id: string) {
    const raceDoc = doc(this.firestore, `${this.collectionName}/${id}`);
    return deleteDoc(raceDoc);
  }
}
