import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable()
export abstract class BaseService {
  protected readonly apiBase = environment.apiBaseUrl;

  constructor(protected http: HttpClient) {}
}