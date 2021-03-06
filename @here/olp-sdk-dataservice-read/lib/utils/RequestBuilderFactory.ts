/*
 * Copyright (C) 2019 HERE Europe B.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 * License-Filename: LICENSE
 */

import { LookupApi } from "@here/olp-sdk-dataservice-api";
import {
    ApiCacheRepository,
    ApiName,
    DataStoreRequestBuilder,
    getEnvLookUpUrl,
    HRN,
    OlpClientSettings
} from "..";

/**
 * A helper utils that makes the `Request` object with the base URLs of the API Lookup Service, token callback, and download manager.
 *
 * Also, you can use it to get the base URLs of the API Lookup Service.
 */
export class RequestFactory {
    /**
     * Factory method for building [[DataStoreRequestBuilder]].
     *
     * @param serviceName The name of the service in the API.
     * @param serviceVersion The version of the service.
     * @param settings The [[OlpClientSettings]] instance.
     * @param hrn A HERE Resource Name ([[HRN]]) of the catalog.
     * @param abortSignal A signal object that allows you to communicate with a request (such as the `fetch` request)
     * and, if required, abort it using the `AbortController` object.
     *
     * For more information, see the [`AbortController` documentation](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
     *
     * @returns The Promise with constructed [[DataStoreRequestBuilder]].
     */
    public static async create(
        serviceName: ApiName,
        serviceVersion: string,
        settings: OlpClientSettings,
        hrn?: HRN,
        abortSignal?: AbortSignal
    ): Promise<DataStoreRequestBuilder> {
        return RequestFactory.getBaseUrl(
            serviceName,
            serviceVersion,
            settings,
            hrn
        )
            .then(async (baseUrl: string) =>
                baseUrl
                    ? Promise.resolve(
                          new DataStoreRequestBuilder(
                              settings.downloadManager,
                              baseUrl,
                              settings.token,
                              abortSignal
                          )
                      )
                    : Promise.reject(
                          `Error getting base url to the service: ${serviceName}`
                      )
            )
            .catch(error =>
                Promise.reject(
                    `Error building Request for service: ${serviceName}.\n${error}`
                )
            );
    }

    /**
     * Gets a base URL of the API service that supports caching.
     *
     * @param serviceName The name of the API service.
     * @param serviceVersion The version of the service.
     * @param settings The [[OlpClientSettings]] instance.
     * @param hrn The [[HRN]] of the catalog.
     *
     * @return The Promise with the base URL of the service.
     */
    public static async getBaseUrl(
        serviceName: ApiName,
        serviceVersion: string,
        settings: OlpClientSettings,
        hrn?: HRN
    ): Promise<string> {
        const apiCache = new ApiCacheRepository(settings.cache, hrn);
        const baseUrl = apiCache.get(serviceName, serviceVersion);
        if (baseUrl) {
            return Promise.resolve(baseUrl);
        }

        const lookUpUrl = getEnvLookUpUrl(settings.environment);
        const lookUpApiRequest = new DataStoreRequestBuilder(
            settings.downloadManager,
            lookUpUrl,
            settings.token
        );

        const apiService = hrn ? LookupApi.resourceAPI : LookupApi.platformAPI;
        const params: {
            api: string;
            version: string;
            hrn: string;
            region?: string | undefined;
        } = {
            api: serviceName,
            version: serviceVersion,
            hrn: ""
        };

        if (hrn) {
            params.hrn = hrn.toString();
        }

        return apiService(lookUpApiRequest, params)
            .then(
                async (
                    result: LookupApi.API[] | LookupApi.ApiNotFoundError
                ) => {
                    if (result instanceof Array && result[0].baseURL) {
                        apiCache.put(
                            serviceName,
                            serviceVersion,
                            result[0].baseURL
                        );
                        return Promise.resolve(result[0].baseURL);
                    }

                    if (!(result instanceof Array) && result.status === 404) {
                        return Promise.reject(
                            `Getting API error: ${result.title}`
                        );
                    }

                    return Promise.reject(
                        `Getting API ${serviceName} unknown error`
                    );
                }
            )
            .catch((error: string) =>
                Promise.reject(`Getting API ${serviceName} error: ${error}`)
            );
    }
}
