/**
 * Clearbit API Integration
 * Provides company and person enrichment data
 */

const axios = require('axios');
const config = require('../config/config');

/**
 * Clearbit API client
 */
class ClearbitApi {
  constructor() {
    this.apiKey = config.apiKeys.clearbit;
    this.baseUrl = 'https://company.clearbit.com/v2';
    this.personUrl = 'https://person.clearbit.com/v2';
  }

  /**
   * Enrich company data using domain
   * @param {string} domain - Company domain
   * @returns {Promise<Object>} - Company data
   */
  async enrichCompany(domain) {
    try {
      const response = await axios.get(`${this.baseUrl}/companies/find`, {
        params: { domain },
        auth: {
          username: this.apiKey,
          password: ''
        }
      });

      return this._formatCompanyData(response.data);
    } catch (error) {
      console.error('Clearbit Company Enrichment Error:', error.message);
      throw new Error('Failed to enrich company data');
    }
  }

  /**
   * Enrich person data using email
   * @param {string} email - Person's email
   * @returns {Promise<Object>} - Person data
   */
  async enrichPerson(email) {
    try {
      const response = await axios.get(`${this.personUrl}/people/find`, {
        params: { email },
        auth: {
          username: this.apiKey,
          password: ''
        }
      });

      return this._formatPersonData(response.data);
    } catch (error) {
      console.error('Clearbit Person Enrichment Error:', error.message);
      throw new Error('Failed to enrich person data');
    }
  }

  /**
   * Search for companies by criteria
   * @param {Object} query - Search criteria
   * @returns {Promise<Object>} - Search results
   */
  async searchCompanies(query) {
    try {
      const response = await axios.get(`${this.baseUrl}/companies/search`, {
        params: query,
        auth: {
          username: this.apiKey,
          password: ''
        }
      });

      return {
        success: true,
        results: response.data.results.map(this._formatCompanyData),
        total: response.data.total
      };
    } catch (error) {
      console.error('Clearbit Company Search Error:', error.message);
      throw new Error('Failed to search companies');
    }
  }

  /**
   * Format company data
   * @param {Object} data - Raw company data
   * @returns {Object} - Formatted company data
   * @private
   */
  _formatCompanyData(data) {
    if (!data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      legalName: data.legalName,
      domain: data.domain,
      domainAliases: data.domainAliases,
      site: {
        url: data.url,
        title: data.site?.title,
        h1: data.site?.h1,
        metaDescription: data.site?.metaDescription,
        phoneNumbers: data.site?.phoneNumbers
      },
      category: {
        sector: data.category?.sector,
        industryGroup: data.category?.industryGroup,
        industry: data.category?.industry,
        subIndustry: data.category?.subIndustry
      },
      tags: data.tags,
      description: data.description,
      foundedYear: data.foundedYear,
      location: data.location,
      timeZone: data.timeZone,
      utcOffset: data.utcOffset,
      geo: data.geo,
      logo: data.logo,
      facebook: {
        handle: data.facebook?.handle,
        likes: data.facebook?.likes
      },
      linkedin: {
        handle: data.linkedin?.handle
      },
      twitter: {
        handle: data.twitter?.handle,
        id: data.twitter?.id,
        bio: data.twitter?.bio,
        followers: data.twitter?.followers,
        following: data.twitter?.following,
        location: data.twitter?.location,
        site: data.twitter?.site,
        avatar: data.twitter?.avatar
      },
      crunchbase: {
        handle: data.crunchbase?.handle
      },
      emailProvider: data.emailProvider,
      type: data.type,
      ticker: data.ticker,
      identifiers: data.identifiers,
      phone: data.phone,
      metrics: {
        alexaUsRank: data.metrics?.alexaUsRank,
        alexaGlobalRank: data.metrics?.alexaGlobalRank,
        employees: data.metrics?.employees,
        employeesRange: data.metrics?.employeesRange,
        marketCap: data.metrics?.marketCap,
        raised: data.metrics?.raised,
        annualRevenue: data.metrics?.annualRevenue,
        estimatedAnnualRevenue: data.metrics?.estimatedAnnualRevenue,
        fiscalYearEnd: data.metrics?.fiscalYearEnd
      },
      tech: data.tech,
      techCategories: data.techCategories,
      parent: {
        domain: data.parent?.domain
      },
      ultimateParent: {
        domain: data.ultimateParent?.domain
      }
    };
  }

  /**
   * Format person data
   * @param {Object} data - Raw person data
   * @returns {Object} - Formatted person data
   * @private
   */
  _formatPersonData(data) {
    if (!data) {
      return null;
    }

    return {
      id: data.id,
      name: {
        fullName: data.name?.fullName,
        givenName: data.name?.givenName,
        familyName: data.name?.familyName
      },
      email: data.email,
      location: data.location,
      timeZone: data.timeZone,
      utcOffset: data.utcOffset,
      geo: data.geo,
      bio: data.bio,
      site: data.site,
      avatar: data.avatar,
      employment: {
        domain: data.employment?.domain,
        name: data.employment?.name,
        title: data.employment?.title,
        role: data.employment?.role,
        seniority: data.employment?.seniority
      },
      facebook: {
        handle: data.facebook?.handle
      },
      github: {
        handle: data.github?.handle,
        avatar: data.github?.avatar,
        company: data.github?.company,
        blog: data.github?.blog,
        followers: data.github?.followers,
        following: data.github?.following
      },
      twitter: {
        handle: data.twitter?.handle,
        id: data.twitter?.id,
        bio: data.twitter?.bio,
        followers: data.twitter?.followers,
        following: data.twitter?.following,
        location: data.twitter?.location,
        site: data.twitter?.site,
        avatar: data.twitter?.avatar
      },
      linkedin: {
        handle: data.linkedin?.handle
      },
      googleplus: {
        handle: data.googleplus?.handle
      },
      gravatar: {
        handle: data.gravatar?.handle,
        urls: data.gravatar?.urls,
        avatar: data.gravatar?.avatar,
        avatars: data.gravatar?.avatars
      },
      fuzzy: data.fuzzy,
      emailProvider: data.emailProvider,
      phone: data.phone
    };
  }
}

module.exports = new ClearbitApi();