import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, updateDoc, deleteDoc, doc, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface TeamModel {
  id: string;
  name: string;
  seasonId: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private firestore = inject(Firestore);
  private collectionName = 'teams';

  getTeams(): Observable<TeamModel[]> {
    const teamsRef = collection(this.firestore, this.collectionName);
    return collectionData(teamsRef, { idField: 'id' }) as Observable<TeamModel[]>;
  }

  getTeamsBySeason(seasonId: string): Observable<TeamModel[]> {
    const teamsRef = collection(this.firestore, this.collectionName);
    const q = query(teamsRef, where('seasonId', '==', seasonId));
    return collectionData(q, { idField: 'id' }) as Observable<TeamModel[]>;
  }

  async addTeam(team: Omit<TeamModel, 'id'>) {
    const teamsRef = collection(this.firestore, this.collectionName);
    return addDoc(teamsRef, team);
  }

  async updateTeam(id: string, team: Partial<TeamModel>) {
    const teamDoc = doc(this.firestore, `${this.collectionName}/${id}`);
    return updateDoc(teamDoc, team);
  }

  async deleteTeam(id: string) {
    const teamDoc = doc(this.firestore, `${this.collectionName}/${id}`);
    return deleteDoc(teamDoc);
  }
}
