import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BaseService {
  protected apiBase = '/api/';

  constructor(protected http: HttpClient) { }
}